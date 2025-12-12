import sys
import json
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from ultralytics import YOLO
from PIL import Image
import numpy as np
import logging
import warnings

# 1. SILENCE THE NOISE
# YOLO and PyTorch love to print logs. We must silence them 
# so Node.js only sees our JSON output.
logging.getLogger("ultralytics").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

def get_vector(image_path):
    try:
        # --- LOAD MODELS ---
        # YOLOv8 Nano (Small & Fast)
        yolo_model = YOLO('yolov8n.pt') 
        
        # ResNet18 (Feature Extractor)
        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        # Remove the last layer (classification) to get the "fingerprint"
        feature_extractor = torch.nn.Sequential(*list(resnet.children())[:-1])
        feature_extractor.eval()

        # --- PROCESS IMAGE ---
        # Detect object
        results = yolo_model(image_path, verbose=False)
        img = Image.open(image_path).convert('RGB')

        # Crop if object found
        if len(results[0].boxes) > 0:
            box = results[0].boxes.xyxy[0].cpu().numpy() # [x1, y1, x2, y2]
            img = img.crop((box[0], box[1], box[2], box[3]))
        
        # Transform for ResNet
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        input_tensor = preprocess(img).unsqueeze(0)
        
        # --- GENERATE VECTOR ---
        with torch.no_grad():
            vector = feature_extractor(input_tensor).flatten().numpy()

        # --- OUTPUT JSON ---
        print(json.dumps({
            "success": True,
            "vector": vector.tolist()
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_vector(sys.argv[1])
    else:
        print(json.dumps({"success": False, "error": "No image path provided"}))