import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

# Sample training data
data = {
    "attendance": [95,90,88,75,65,55,45,98,82,72],
    "marks":[92,85,80,70,60,55,40,95,78,68],
    "result":[
        "Excellent",
        "Excellent",
        "Good",
        "Good",
        "Average",
        "Average",
        "Poor",
        "Excellent",
        "Good",
        "Average"
    ]
}

df = pd.DataFrame(data)

X = df[["attendance","marks"]]
y = df["result"]

model = DecisionTreeClassifier()

model.fit(X,y)

joblib.dump(model,"ai_prediction/ml_model.pkl")

print("AI Model Trained Successfully")