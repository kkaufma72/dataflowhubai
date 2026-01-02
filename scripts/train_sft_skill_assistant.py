"""
Minimal TRL SFTTrainer script to fine-tune a small chat model for the Skills Hub assistant.

It uses a tiny, inline dataset with `messages` so TRL will apply the model's chat template
automatically. Replace `base_model` with your preferred instruct model (e.g., Qwen/Q4/Baichuan).
"""

import argparse
from pathlib import Path
from typing import List

from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import SFTConfig, SFTTrainer


def build_dataset() -> Dataset:
    """
    Create a starter dataset with a few structured examples.

    Each example is a chat conversation with system/user/assistant roles. The assistant responses
    show the JSON action schema and the explanatory style we want to enforce.
    """
    examples: List[dict] = [
        {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are the DataFlowHub Skills assistant. Always respond with:\n"
                        "1) A brief rationale (<=3 sentences)\n"
                        "2) A JSON action named `skill_plan` with fields: "
                        "`goal`, `steps` (array of strings), `outputs` (array), `warnings` (array).\n"
                        "Be concise and keep JSON valid. Do not include code fences around JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Suggest cross-validation settings for a 5k-row classification dataset. "
                        "Model options: random_forest, xgboost."
                    ),
                },
                {
                    "role": "assistant",
                    "content": (
                        "Use a moderate fold count and track f1 to guard against class imbalance.\n"
                        '{"skill_plan": {"goal": "Select CV settings", "steps": ['
                        '"Use 5-fold stratified CV", "Metric: f1", '
                        '"Start with random_forest; compare xgboost if GPU available"], '
                        '"outputs": ["folds=5", "metric=f1", "algorithms=[random_forest,xgboost]"], '
                        '"warnings": ["Ensure target is categorical", "Scale numeric features"]}}'
                    ),
                },
            ]
        },
        {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are the DataFlowHub Skills assistant. Always respond with:\n"
                        "1) A brief rationale (<=3 sentences)\n"
                        "2) A JSON action named `skill_plan` with fields: "
                        "`goal`, `steps`, `outputs`, `warnings`."
                    ),
                },
                {
                    "role": "user",
                    "content": "Explain how to interpret cross-validation results showing accuracy 0.82 ±0.03.",
                },
                {
                    "role": "assistant",
                    "content": (
                        "The scores are stable across folds; modest variance suggests consistent generalization.\n"
                        '{"skill_plan": {"goal": "Summarize CV results", "steps": ['
                        '"Report mean accuracy 0.82", "Note std 0.03 indicates stable folds", '
                        '"Recommend checking precision/recall if classes are imbalanced"], '
                        '"outputs": ["mean_accuracy=0.82", "std=0.03"], '
                        '"warnings": ["Validate with hold-out set if available"]}}'
                    ),
                },
            ]
        },
    ]

    return Dataset.from_list(examples)


def train(
    base_model: str,
    output_dir: Path,
    max_steps: int = 200,
    per_device_train_batch_size: int = 2,
    gradient_accumulation_steps: int = 8,
    learning_rate: float = 1e-5,
) -> None:
    """Run a short SFT session."""
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    if tokenizer.pad_token is None:
        # Many chat models lack pad token; use eos to avoid warnings.
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype="auto",
        device_map="auto",
    )

    dataset = build_dataset().train_test_split(test_size=0.2, seed=42)

    training_config = SFTConfig(
        output_dir=str(output_dir),
        max_steps=max_steps,
        per_device_train_batch_size=per_device_train_batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=learning_rate,
        warmup_ratio=0.05,
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=50,
        save_steps=100,
        bf16=True,
        packing=True,
        lr_scheduler_type="cosine",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset["train"],
        eval_dataset=dataset["test"],
        args=training_config,
        formatting_func=None,  # messages-based, handled by TRL with chat template
    )

    trainer.train()
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a small SFT model for Skills Hub.")
    parser.add_argument(
        "--base_model",
        type=str,
        default="Qwen/Qwen2.5-1.5B-Instruct",
        help="Base instruct model with a chat template.",
    )
    parser.add_argument(
        "--output_dir",
        type=Path,
        default=Path("artifacts/skills-sft"),
        help="Where to store the fine-tuned model.",
    )
    parser.add_argument("--max_steps", type=int, default=200)
    parser.add_argument("--per_device_train_batch_size", type=int, default=2)
    parser.add_argument("--gradient_accumulation_steps", type=int, default=8)
    parser.add_argument("--learning_rate", type=float, default=1e-5)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    train(
        base_model=args.base_model,
        output_dir=args.output_dir,
        max_steps=args.max_steps,
        per_device_train_batch_size=args.per_device_train_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
    )
