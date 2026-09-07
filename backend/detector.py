import os
import tensorflow as tf
import numpy as np

from object_detection.utils import config_util
from object_detection.builders import model_builder



MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "model",
    "saved_model",
)

LABELS = {
    1: "A",
    2: "B",
    3: "C",
    4: "1",
    5: "2",
    6: "MOBILE",
    7: "YES",
    8: "NO",
    9: "HELP",
    10: "PLEASE",
    11: "THANKS",
    12: "SORRY",
    13: "ME",
    14: "CAT",
    15: "EAT",
    16: "BOOK",
    17: "FRIEND",
    18: "WATER",
    19: "NAME",
    20: "HELLO",
}


print("Loading ASL2VOICE model...")

detect_fn = tf.saved_model.load(MODEL_PATH)

print("ASL2VOICE model loaded successfully.")


def detect(image):
    """
    Run ASL detection on a BGR OpenCV image.
    """

    image_rgb = image[:, :, ::-1]

    input_tensor = tf.convert_to_tensor(
        np.expand_dims(image_rgb, axis=0),
        dtype=tf.uint8
    )

    detections = detect_fn(input_tensor)

    num_detections = int(detections.pop("num_detections"))

    detections = {
        key: value[0, :num_detections].numpy()
        for key, value in detections.items()
    }

    detections["detection_classes"] = (
        detections["detection_classes"].astype(np.int64)
    )

    scores = detections["detection_scores"]
    classes = detections["detection_classes"]
    boxes = detections["detection_boxes"]

    best_index = int(np.argmax(scores))
    best_score = float(scores[best_index])
    best_class = int(classes[best_index])

    if best_class in LABELS:
        label = LABELS[best_class]
    else:
        label = "UNKNOWN"

    box = boxes[best_index].tolist()

    return {
        "label": label,
        "confidence": best_score,
        "box": box
    }