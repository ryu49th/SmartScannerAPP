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

# ... imports stay the same ...

# ... imports stay the same ...

def get_vector(image_path):
    try:
        # ... Model loading stays the same ...
        yolo_model = YOLO('yolov8n.pt') 
        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        feature_extractor = torch.nn.Sequential(*list(resnet.children())[:-1])
        feature_extractor.eval()

        # ... Detection & Crop stays the same ...
        results = yolo_model(image_path, verbose=False)
        img = Image.open(image_path).convert('RGB')
        if len(results[0].boxes) > 0:
            box = results[0].boxes.xyxy[0].cpu().numpy()
            img = img.crop((box[0], box[1], box[2], box[3]))
        
        # --- NEW: Test Time Augmentation (TTA) ---
        # We will get vectors for the image AND its mirror reflection
        # This helps the AI recognize the object even if it's facing the other way
        
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        # 1. Normal Image
        input_tensor_1 = preprocess(img).unsqueeze(0)
        
        # 2. Flipped Image (Mirror)
        img_flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
        input_tensor_2 = preprocess(img_flipped).unsqueeze(0)
        
        with torch.no_grad():
            vec1 = feature_extractor(input_tensor_1).flatten().numpy()
            vec2 = feature_extractor(input_tensor_2).flatten().numpy()

        # Combine them (Average) to create a "Super Vector"
        combined_vector = (vec1 + vec2) / 2.0

        print(json.dumps({
            "success": True,
            "vector": combined_vector.tolist()
        }))

    except Exception as e:
        # ... error handling ...
        # ... error handling ...
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_vector(sys.argv[1])
    else:
        print(json.dumps({"success": False, "error": "No image path provided"}))