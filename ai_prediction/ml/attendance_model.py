import os
import joblib
import numpy as np

from sklearn.ensemble import RandomForestClassifier


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ai_prediction",
    "ml",
    "student_risk_model.pkl"
)


# ============================================================
# TRAINING DATA
# ============================================================
#
# Features:
# 1. attendance_percentage
# 2. average_marks
# 3. total_classes
# 4. absent_classes
#
# Risk:
# LOW / MEDIUM / HIGH
# ============================================================

X = np.array([

    # LOW RISK
    [95, 92, 40, 2],
    [90, 85, 30, 3],
    [88, 80, 40, 5],
    [85, 78, 35, 5],
    [82, 75, 40, 7],

    # MEDIUM RISK
    [80, 70, 40, 8],
    [78, 68, 40, 9],
    [75, 65, 40, 10],
    [72, 60, 50, 14],

    # HIGH RISK
    [68, 58, 40, 13],
    [65, 55, 40, 14],
    [62, 52, 50, 19],
    [60, 50, 50, 20],
    [55, 48, 40, 18],
    [50, 45, 30, 15],
    [45, 40, 30, 17],
    [40, 35, 30, 18],
    [35, 30, 40, 26],

    # VERY LOW ATTENDANCE
    [30, 80, 10, 7],
    [20, 85, 10, 8],
    [10, 90, 10, 9],
    [0, 95, 10, 10],
])


y = np.array([

    "LOW",
    "LOW",
    "LOW",
    "LOW",
    "LOW",

    "MEDIUM",
    "MEDIUM",
    "MEDIUM",
    "MEDIUM",

    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",

    "HIGH",
    "HIGH",
    "HIGH",
    "HIGH",
])


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model():

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(X, y)

    joblib.dump(
        model,
        MODEL_PATH
    )

    print("Student Risk Model trained successfully!")
    print(f"Model saved at: {MODEL_PATH}")

    return model


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):
        return train_model()

    return joblib.load(MODEL_PATH)


# ============================================================
# PREDICT STUDENT RISK
# ============================================================

def predict_student_risk(
    attendance_percentage,
    average_marks,
    total_classes,
    absent_classes
):

    # --------------------------------------------------------
    # BASIC ATTENDANCE SAFETY RULES
    # --------------------------------------------------------

    if attendance_percentage < 50:

        return "HIGH", 100.0

    if attendance_percentage < 60:

        return "HIGH", 95.0

    if attendance_percentage < 75:

        return "MEDIUM", 90.0


    # --------------------------------------------------------
    # MACHINE LEARNING PREDICTION
    # --------------------------------------------------------

    model = load_model()

    features = np.array([
        [
            attendance_percentage,
            average_marks,
            total_classes,
            absent_classes
        ]
    ])

    prediction = model.predict(features)[0]

    probabilities = model.predict_proba(features)[0]

    confidence = round(
        float(max(probabilities)) * 100,
        1
    )


    # --------------------------------------------------------
    # FINAL ATTENDANCE VALIDATION
    # --------------------------------------------------------

    if attendance_percentage < 75:

        if attendance_percentage < 60:
            prediction = "HIGH"
        else:
            prediction = "MEDIUM"


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return prediction, confidence