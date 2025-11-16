# 📊 Model Evaluation - Dynamic Visualization Plan

## Current Status
Model Evaluation page currently shows generic metrics regardless of model type. We need to make it intelligent and show appropriate visualizations based on whether it's classification or regression.

## Smart Detection Logic

```typescript
const isClassification = (model: MLModel): boolean => {
  // Check model type
  if (model.modelType?.toLowerCase().includes('classification')) return true;
  if (model.modelType?.toLowerCase().includes('regression')) return false;
  
  // Check algorithm name
  const classificationAlgorithms = [
    'logistic', 'svm', 'random forest classifier', 'decision tree classifier',
    'naive bayes', 'knn classifier', 'xgboost classifier', 'neural network classifier'
  ];
  const algorithmName = model.name?.toLowerCase() || '';
  if (classificationAlgorithms.some(alg => algorithmName.includes(alg))) return true;
  
  // Check metrics (classification metrics)
  const classificationMetrics = ['accuracy', 'precision', 'recall', 'f1', 'auc', 'roc'];
  if (model.metrics && Object.keys(model.metrics).some(key => 
    classificationMetrics.some(metric => key.toLowerCase().includes(metric))
  )) return true;
  
  // Default to classification
  return true;
};
```

---

## Tab Structure (4 tabs total)

### Tab 1: **Overview** (Same for both)
- Key metrics cards (4-6 cards)
- Model information
- Training configuration
- Performance over time chart (if historical data)

---

### Tab 2: **Performance** (Conditional)

#### For Classification:
1. **Confusion Matrix** (Visual Grid)
   ```
   [Predicted Positive] [Predicted Negative]
   [    True Pos      ] [   False Neg      ]  Actual Positive
   [    False Pos     ] [   True Neg       ]  Actual Negative
   ```
   - Color-coded cells (green for correct, red for errors)
   - Percentages and counts
   - Hover tooltips

2. **ROC Curve** (Already exists)
   - Area chart with diagonal reference line
   - AUC score displayed
   - Interactive AI insights

3. **Precision-Recall Curve**
   - Shows trade-off at different thresholds
   - F1 score marked
   - Useful for imbalanced datasets

4. **Classification Report Table**
   ```
   | Class      | Precision | Recall | F1-Score | Support |
   |------------|-----------|--------|----------|---------|
   | Class 0    |   0.92    |  0.89  |   0.90   |   150   |
   | Class 1    |   0.87    |  0.91  |   0.89   |   120   |
   | Macro Avg  |   0.90    |  0.90  |   0.90   |   270   |
   | Weighted   |   0.90    |  0.90  |   0.90   |   270   |
   ```

#### For Regression:
1. **Residual Plot** (Scatter)
   - X-axis: Predicted values
   - Y-axis: Residuals (Actual - Predicted)
   - Horizontal line at y=0
   - Shows if errors are random or have patterns

2. **Predicted vs Actual** (Scatter)
   - X-axis: Actual values
   - Y-axis: Predicted values
   - Diagonal reference line (perfect prediction)
   - Points above line = overprediction
   - Points below line = underprediction

3. **Error Distribution** (Histogram)
   - Distribution of residuals
   - Should be roughly normal (bell curve)
   - Mean should be near 0
   - Shows systematic bias if shifted

4. **Regression Metrics Cards**
   - MAE (Mean Absolute Error)
   - MSE (Mean Squared Error)
   - RMSE (Root Mean Squared Error)
   - R² (Coefficient of Determination)
   - MAPE (Mean Absolute Percentage Error)

---

### Tab 3: **Feature Analysis** (Same for both)
- Feature importance chart (Already exists)
- Top 10 most important features
- Feature correlation heatmap (optional)
- AI insights about feature selection

---

### Tab 4: **Predictions** (Conditional)

#### For Classification:
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Sample ID</TableHeaderCell>
      <TableHeaderCell>Actual Class</TableHeaderCell>
      <TableHeaderCell>Predicted Class</TableHeaderCell>
      <TableHeaderCell>Confidence</TableHeaderCell>
      <TableHeaderCell>Correct?</TableHeaderCell>
      <TableHeaderCell>Input Features</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {samples.map((sample) => (
      <TableRow key={sample.id}>
        <TableCell>{sample.id}</TableCell>
        <TableCell>
          <Badge color={getClassColor(sample.actual)}>
            {sample.actual}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge color={getClassColor(sample.predicted)}>
            {sample.predicted}
          </Badge>
        </TableCell>
        <TableCell>
          <Text>{(sample.confidence * 100).toFixed(1)}%</Text>
          <ProgressBar value={sample.confidence * 100} color={sample.confidence > 0.8 ? 'green' : 'yellow'} />
        </TableCell>
        <TableCell>
          {sample.correct ? '✅' : '❌'}
        </TableCell>
        <TableCell>
          <Text className="text-xs truncate">{sample.features}</Text>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### For Regression:
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Sample ID</TableHeaderCell>
      <TableHeaderCell>Actual Value</TableHeaderCell>
      <TableHeaderCell>Predicted Value</TableHeaderCell>
      <TableHeaderCell>Error</TableHeaderCell>
      <TableHeaderCell>% Error</TableHeaderCell>
      <TableHeaderCell>Input Features</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {samples.map((sample) => (
      <TableRow key={sample.id}>
        <TableCell>{sample.id}</TableCell>
        <TableCell>
          <Metric>{sample.actual.toFixed(2)}</Metric>
        </TableCell>
        <TableCell>
          <Metric color={Math.abs(sample.error) < threshold ? 'green' : 'red'}>
            {sample.predicted.toFixed(2)}
          </Metric>
        </TableCell>
        <TableCell>
          <Text color={sample.error > 0 ? 'rose' : 'emerald'}>
            {sample.error > 0 ? '+' : ''}{sample.error.toFixed(2)}
          </Text>
        </TableCell>
        <TableCell>
          <BadgeDelta deltaType={Math.abs(sample.percentError) < 5 ? 'unchanged' : 'decrease'}>
            {sample.percentError.toFixed(1)}%
          </BadgeDelta>
        </TableCell>
        <TableCell>
          <Text className="text-xs truncate">{sample.features}</Text>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Implementation Priority

### Phase 1: Detection Logic ✅
- Add `isClassification()` helper function
- Use `model.modelType` or algorithm name
- Fallback to metrics detection

### Phase 2: Conditional Rendering 🎯
- Wrap Performance tab content with conditional
- Show classification metrics OR regression metrics
- Keep Overview and Feature Analysis as-is

### Phase 3: Visualizations 🚀
**Classification** (in order):
1. ✅ Confusion Matrix component
2. ✅ Classification Report table
3. ✅ Update Predictions table for classes

**Regression** (in order):
1. ✅ Residual Plot component
2. ✅ Predicted vs Actual scatter
3. ✅ Error Distribution histogram
4. ✅ Update Predictions table for values

### Phase 4: Sample Data 📊
- Generate mock predictions for demo
- Will be replaced with real predictions from backend
- Use realistic distributions

---

## Code Structure

```typescript
const ModelEvaluationContent = () => {
  // ... existing code ...
  
  // Add detection
  const isClassificationModel = useMemo(() => {
    return isClassification(selectedModel);
  }, [selectedModel]);
  
  return (
    <main>
      {/* ... existing header ... */}
      
      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Performance</Tab>
          <Tab>Feature Analysis</Tab>
          <Tab>Predictions</Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Overview - Same for both */}
          <TabPanel>
            {/* ... existing overview content ... */}
          </TabPanel>

          {/* Tab 2: Performance - Conditional */}
          <TabPanel>
            {isClassificationModel ? (
              <ClassificationPerformance model={selectedModel} />
            ) : (
              <RegressionPerformance model={selectedModel} />
            )}
          </TabPanel>

          {/* Tab 3: Feature Analysis - Same for both */}
          <TabPanel>
            {/* ... existing feature importance ... */}
          </TabPanel>

          {/* Tab 4: Predictions - Conditional */}
          <TabPanel>
            {isClassificationModel ? (
              <ClassificationPredictions model={selectedModel} />
            ) : (
              <RegressionPredictions model={selectedModel} />
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
};
```

---

## Benefits

✅ **Intelligent**: Auto-detects model type
✅ **Relevant**: Shows appropriate metrics/visualizations
✅ **Professional**: Matches ML best practices
✅ **Educational**: Helps users understand their models
✅ **Flexible**: Easy to add more types (clustering, etc.)

---

## Next Steps

1. **Implement detection logic** - Quick win
2. **Create conditional rendering** - Structure change
3. **Build classification components** - Most common use case
4. **Build regression components** - Second priority
5. **Add sample data generation** - For testing
6. **Connect to real predictions** - Backend integration

**Want me to start implementing this?** I can create the detection logic and conditional structure first, then build out the visualizations one by one.
