# ML Cheat Sheet - Quick Reference Guide

> **Your 5-minute cheat code to sound like an ML expert**

---

## 🎯 TARGET VARIABLES (What You're Predicting)

### Quick Decision Tree:
```
Are you predicting a NUMBER? → REGRESSION
├─ Sales revenue: $45,234
├─ House price: $350,000
├─ Temperature: 72°F
└─ Stock price: $142.50

Are you predicting a CATEGORY? → CLASSIFICATION
├─ Yes/No (Binary): Will customer churn? YES
├─ Multiple choices: Product category? ELECTRONICS
└─ Spam/Not Spam: Is this email spam? SPAM
```

### How to Explain:
**"Our target variable is customer churn—we're predicting whether someone will cancel in the next 30 days. It's a binary classification problem."**

---

## 🤖 ALGORITHMS - When to Use What

### The 30-Second Pitch for Each:

| Algorithm | When to Use | How to Explain | Example |
|-----------|-------------|----------------|---------|
| **Logistic Regression** | Simple yes/no predictions, need to explain it | "Linear model for binary outcomes—fast and interpretable" | Email spam detection |
| **Random Forest** | Most use cases, your safe bet | "Builds 100s of decision trees and averages them—accurate and robust" | Fraud detection |
| **XGBoost** | When you need the best accuracy | "Boosting algorithm that learns from mistakes—usually wins competitions" | Loan default prediction |
| **Neural Network** | Complex patterns, lots of data | "Mimics brain neurons—great for images, text, complex relationships" | Image recognition |
| **SVM** | Small datasets, high dimensions | "Finds optimal boundary between classes—works well with limited data" | Medical diagnosis |
| **Linear Regression** | Predicting continuous numbers | "Draws best-fit line through data—simple and interpretable" | House price prediction |
| **Decision Tree** | Need full transparency | "Series of yes/no questions—anyone can follow the logic" | Loan approval process |
| **K-Nearest Neighbors** | When similar items should have similar predictions | "Looks at 5 nearest neighbors and averages their values" | Product recommendations |

### Quick Selection Guide:
```
Small dataset (<1K rows)     → Logistic Regression, SVM
Medium dataset (1K-100K)     → Random Forest, XGBoost
Large dataset (100K+)        → XGBoost, Neural Networks
Need explainability          → Logistic Regression, Decision Tree
Want best accuracy           → XGBoost, Random Forest
Have images/text             → Neural Networks
```

---

## ⚙️ HYPERPARAMETERS - The Knobs You Turn

### Think of Hyperparameters as:
**"Settings you adjust BEFORE training to control how the model learns"**

### Most Important by Algorithm:

#### **Random Forest**
```python
n_estimators = 100          # How many trees? (more = slower but better)
max_depth = 10              # How deep each tree? (deeper = risk overfitting)
min_samples_split = 2       # Min samples to split node (higher = simpler)
```
**Explain it:** *"We're building 100 decision trees, each max 10 levels deep, to prevent overfitting"*

#### **XGBoost**
```python
learning_rate = 0.1         # How fast to learn? (lower = slower but safer)
max_depth = 6               # Tree depth (3-10 typical)
n_estimators = 100          # Number of boosting rounds
subsample = 0.8             # Use 80% of data each round (prevents overfitting)
```
**Explain it:** *"We're learning slowly (0.1 rate) with 100 rounds, using 80% of data each time to avoid memorizing"*

#### **Neural Network**
```python
hidden_layers = [64, 32]    # Two layers with 64 and 32 neurons
learning_rate = 0.001       # How fast to adjust weights
batch_size = 32             # Process 32 samples at a time
epochs = 50                 # Go through entire dataset 50 times
```
**Explain it:** *"We have a 2-layer network with 64 and 32 neurons, training for 50 passes through the data"*

#### **Logistic Regression**
```python
C = 1.0                     # Regularization (lower = simpler model)
penalty = 'l2'              # Type of regularization (l1 or l2)
```
**Explain it:** *"We're using L2 regularization with strength 1.0 to prevent overfitting"*

### Hyperparameter Tuning Strategies:

#### **1. Grid Search** (Exhaustive but slow)
```
Try every combination:
learning_rate: [0.01, 0.1, 0.3]
max_depth: [3, 6, 9]
→ Tests all 9 combinations (3 × 3)
```
**When to use:** Small search space, need thoroughness  
**Explain it:** *"We tested every combination of settings to find the optimal configuration"*

#### **2. Random Search** (Faster, still effective)
```
Randomly sample from ranges:
learning_rate: uniform(0.01, 0.3)
max_depth: randint(3, 10)
→ Tests 50 random combinations
```
**When to use:** Large search space, time constrained  
**Explain it:** *"We randomly sampled 50 configurations—research shows it's 90% as good as grid search in 10% of the time"*

#### **3. Bayesian Optimization** (Smart search)
```
Uses previous results to pick next hyperparameters
→ Focuses on promising regions
```
**When to use:** Expensive models (neural networks), limited budget  
**Explain it:** *"We used smart search that learns from previous attempts—like a GPS finding the fastest route"*

---

## 📊 OPTIMIZATION METRICS - How You Score Success

### The Decision Matrix:

```
CLASSIFICATION METRICS (Predicting Categories)

Accuracy = Correct predictions / Total predictions
├─ Use when: Classes are balanced (50% yes, 50% no)
├─ Example: 90% accuracy = 90 out of 100 correct
└─ Don't use when: Imbalanced (99% no spam, 1% spam)

Precision = True Positives / (True Positives + False Positives)
├─ Use when: False positives are costly
├─ Example: Spam filter—don't want to block real emails
└─ "When I predict YES, how often am I right?"

Recall = True Positives / (True Positives + False Negatives)
├─ Use when: False negatives are costly
├─ Example: Cancer detection—don't want to miss cases
└─ "Of all actual YES cases, how many did I catch?"

F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
├─ Use when: Need balance between precision and recall
├─ Example: Fraud detection—balance catching fraud vs false alarms
└─ "Harmonic mean of precision and recall"

ROC-AUC = Area under ROC curve (0.5-1.0)
├─ Use when: Need probability scores, not just yes/no
├─ Example: Loan risk scoring—rank by risk level
└─ "How well can the model separate classes?"
```

```
REGRESSION METRICS (Predicting Numbers)

MAE (Mean Absolute Error) = Average of |actual - predicted|
├─ Use when: Want intuitive, same-unit error
├─ Example: MAE = $5,000 means predictions off by $5K on average
└─ "Average dollar amount we're off by"

RMSE (Root Mean Squared Error) = √(average of (actual - predicted)²)
├─ Use when: Want to penalize large errors more
├─ Example: RMSE = $7,500 (punishes $20K error more than MAE)
└─ "Like MAE but big mistakes hurt more"

R² (R-squared) = 1 - (model error / baseline error)
├─ Use when: Want % of variance explained
├─ Example: R² = 0.85 means model explains 85% of variation
└─ "How much better than just guessing the average?"

MAPE (Mean Absolute % Error) = Average of |actual - predicted| / actual
├─ Use when: Want error as percentage
├─ Example: MAPE = 10% means off by 10% on average
└─ "Average percentage we're off by"
```

### Quick Decision Chart:
```
CLASSIFICATION:
Balanced classes?           → Accuracy
False positives expensive?  → Precision (don't cry wolf)
False negatives expensive?  → Recall (don't miss cases)
Both matter equally?        → F1-Score
Need probability ranking?   → ROC-AUC

REGRESSION:
Want intuitive error?       → MAE ($5K off on average)
Penalize big mistakes?      → RMSE
Want % explained?           → R²
Want % error?               → MAPE
```

### How to Explain in Interviews:
**"For this churn prediction, we optimized for recall because missing a customer who's about to leave is more costly than sending a retention offer to someone who wasn't leaving. We achieved 87% recall with 89% precision, giving us an F1-score of 0.88."**

---

## 🔄 TRANSFORMATION TYPES - Making Data Model-Ready

### The Essential Transformations:

#### **1. Scaling (Normalization)**
```python
Original: [10, 50, 100, 5000]
Normalized: [0.002, 0.01, 0.02, 1.0]

Why: Prevents features with big numbers from dominating
When: Neural networks, SVM, K-Nearest Neighbors
```
**Explain it:** *"We scaled all features to 0-1 range so income ($100K) doesn't overpower age (45)"*

**Types:**
- **Min-Max Scaling**: Squish to 0-1 range
- **Standard Scaling**: Mean=0, StdDev=1 (most common)
- **Robust Scaling**: Uses median (handles outliers)

#### **2. Encoding Categorical Variables**
```python
Original: ["Red", "Blue", "Green", "Red"]

One-Hot Encoding:
Red: [1, 0, 0, 1]
Blue: [0, 1, 0, 0]
Green: [0, 0, 1, 0]

Label Encoding:
Red=0, Blue=1, Green=2 → [0, 1, 2, 0]
```
**When to use:**
- One-Hot: No natural order (colors, countries) - **MOST COMMON**
- Label: Natural order (Small=0, Medium=1, Large=2)
- Target: Encoding target variable for classification

**Explain it:** *"We one-hot encoded product categories, creating a binary column for each category"*

#### **3. Handling Missing Values**
```python
Strategy 1: Drop rows/columns with missing data
├─ When: <5% missing, large dataset
└─ Risk: Lose information

Strategy 2: Fill with mean/median/mode
├─ When: Numerical data, < 30% missing
└─ Example: Age missing? Fill with median age (35)

Strategy 3: Fill with constant
├─ When: Categorical data
└─ Example: Country missing? Fill with "Unknown"

Strategy 4: Predictive imputation
├─ When: >30% missing, important feature
└─ Example: Use other features to predict missing values
```
**Explain it:** *"We filled missing income values with the median ($65K) since the data was skewed by high earners"*

#### **4. Feature Engineering**
```python
Original features:
- purchase_date: "2025-01-15"
- birth_date: "1990-05-20"

Engineered features:
- days_since_purchase: 45
- age: 35
- day_of_week: "Monday"
- is_weekend: 0
- season: "Winter"
```
**Explain it:** *"We extracted day of week from purchase date—found Friday purchases have 40% higher conversion"*

#### **5. Outlier Handling**
```python
Original: [10, 15, 12, 18, 500, 14, 11]
                         ↑ outlier

Strategy 1: Remove
Result: [10, 15, 12, 18, 14, 11]

Strategy 2: Cap (Winsorize)
Result: [10, 15, 12, 18, 25, 14, 11]  # Cap at 95th percentile

Strategy 3: Transform
Result: [2.3, 2.7, 2.5, 2.9, 6.2, 2.6, 2.4]  # Log transform
```
**When to use:**
- Remove: Data errors, <1% of data
- Cap: Real but extreme values
- Transform: Skewed distributions

**Explain it:** *"We capped income at the 95th percentile ($250K) to prevent billionaires from skewing the model"*

#### **6. Binning (Discretization)**
```python
Original age: [23, 45, 67, 31, 54]

Binned age:
├─ 18-30: "Young" → [1, 0, 0, 1, 0]
├─ 31-50: "Middle" → [0, 1, 0, 0, 1]
└─ 51+: "Senior" → [0, 0, 1, 0, 0]
```
**When to use:** Capture non-linear relationships, make interpretable  
**Explain it:** *"We grouped ages into brackets—found 18-25 and 65+ have similar behavior"*

---

## ⚙️ CONFIGURATIONS - Common Setups

### Training Configuration
```python
train_test_split:
├─ train: 70% → Build model
├─ validation: 15% → Tune hyperparameters
└─ test: 15% → Final evaluation (never seen before)

Cross-validation:
├─ 5-fold: Split data into 5 parts, train on 4, test on 1, repeat 5 times
└─ Why: More robust than single train/test split
```

### Pipeline Configuration
```python
Typical ML Pipeline:
1. Load data
2. Handle missing values
3. Encode categorical variables
4. Scale numerical features
5. Split train/test
6. Train model with hyperparameter tuning
7. Evaluate on test set
8. Deploy to production
```

---

## 🎤 INTERVIEW POWER PHRASES

### When Choosing an Algorithm:
- **"We chose XGBoost because it handles non-linear relationships well and typically gives the best accuracy out of the box"**
- **"Random Forest was our go-to since it's robust to overfitting and requires minimal tuning"**
- **"We started with Logistic Regression as a baseline—it's fast, interpretable, and often hard to beat with small datasets"**

### When Discussing Metrics:
- **"We optimized for recall because missing a fraudulent transaction costs more than investigating a false positive"**
- **"Our F1-score of 0.88 shows we balanced precision and recall well"**
- **"The model achieved 92% accuracy, but more importantly, the ROC-AUC of 0.94 shows it ranks predictions correctly"**

### When Explaining Transformations:
- **"We one-hot encoded categories to avoid implying order—'Red' isn't mathematically greater than 'Blue'"**
- **"Standard scaling was crucial for the neural network to converge—features on different scales cause training instability"**
- **"We filled missing values with the median instead of mean because the data had outliers that would skew the average"**

### When Discussing Hyperparameters:
- **"We used grid search to test 50 combinations—found learning_rate=0.1 and max_depth=6 gave the best validation score"**
- **"Lower learning rate (0.01) prevented overfitting but required more epochs to converge"**
- **"We set n_estimators=200 for Random Forest—beyond that, accuracy plateaued but training time doubled"**

### When Handling Challenges:
- **"The data was imbalanced (95% no churn, 5% churn), so we used SMOTE to oversample the minority class"**
- **"We detected data leakage—transaction_date was leaking future information, so we removed it"**
- **"Model was overfitting (99% train, 75% test), so we increased regularization and reduced model complexity"**

---

## 🚀 QUICK REFERENCE TABLE

| Concept | Beginner Explanation | Expert Explanation |
|---------|---------------------|-------------------|
| **Target Variable** | "The thing we're trying to predict" | "Dependent variable Y in supervised learning" |
| **Features** | "The information we use to make predictions" | "Independent variables X used as model inputs" |
| **Training** | "Teaching the model by showing examples" | "Optimizing model parameters via gradient descent" |
| **Overfitting** | "Model memorizes training data, fails on new data" | "High variance—model captures noise, not signal" |
| **Underfitting** | "Model too simple, performs poorly everywhere" | "High bias—model can't capture underlying patterns" |
| **Hyperparameters** | "Settings we choose before training" | "Meta-parameters controlling learning process" |
| **Cross-validation** | "Test model on multiple train/test splits" | "K-fold resampling for unbiased performance estimation" |
| **Regularization** | "Penalty for complexity to prevent overfitting" | "L1/L2 constraints on weight magnitudes" |
| **Feature Engineering** | "Creating new features from existing data" | "Domain-driven transformation of raw inputs" |
| **Ensemble** | "Combining multiple models for better results" | "Aggregating diverse weak learners via bagging/boosting" |

---

## 💡 PRO TIPS

### Red Flags to Avoid:
❌ "We used accuracy for imbalanced data" → Shows you don't understand metrics  
❌ "We tuned hyperparameters on test set" → That's data leakage!  
❌ "Neural networks always perform best" → Shows lack of nuance  
❌ "We didn't scale features for neural networks" → Recipe for disaster  
❌ "100% training accuracy is great!" → That's massive overfitting  

### Green Flags to Hit:
✅ "We used stratified k-fold cross-validation to handle imbalanced classes"  
✅ "Validation loss plateaued at epoch 30, so we used early stopping"  
✅ "We compared 5 algorithms and selected XGBoost based on validation F1-score"  
✅ "Feature importance showed 'days_since_purchase' drove 40% of predictions"  
✅ "We monitored for data drift in production—accuracy dropped 5% after 3 months"  

---

## 🎯 THE 30-SECOND FRAMEWORK

**When asked "How does your ML model work?":**

1. **Problem** (5 sec): "We're predicting customer churn"
2. **Data** (5 sec): "We have 50K customers with purchase history and demographics"
3. **Approach** (10 sec): "We trained XGBoost with 100 trees, optimizing for recall since missing churners is costly"
4. **Results** (5 sec): "Achieved 87% recall and 89% precision—now deployed via REST API"
5. **Impact** (5 sec): "Reduced churn by 15%, saving $2M annually"

**Total: 30 seconds, sounds like a pro.**

---

## 🔥 MEMORIZE THESE 5 THINGS

1. **XGBoost + Random Forest = 80% of use cases** (learn these deep)
2. **F1-Score = balance of precision & recall** (most common metric)
3. **Standard Scaling + One-Hot Encoding = most common preprocessing**
4. **70/15/15 split = train/validation/test** (standard)
5. **Grid Search = thorough, Random Search = faster** (tuning tradeoff)

---

**Print this, stick it on your wall, review before every interview. You got this.** 🚀
