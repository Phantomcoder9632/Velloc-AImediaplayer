import cv2
import os
import numpy as np

# Path to your gestures folder
folder_path = os.path.join('frontend', 'public', 'gestures')

print(f"Scanning folder: {folder_path}...")

if not os.path.exists(folder_path):
    print("Error: The folder does not exist. Please check the path.")
else:
    # Loop through all files in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith(".png"):
            filepath = os.path.join(folder_path, filename)
            
            # Read the image WITH the alpha channel (transparency)
            img = cv2.imread(filepath, cv2.IMREAD_UNCHANGED)
            
            if img is None:
                print(f"Could not read {filename}, skipping.")
                continue
                
            # Check if the image has 4 channels (Blue, Green, Red, Alpha)
            if len(img.shape) == 3 and img.shape[2] == 4:
                # Split the channels
                b, g, r, a = cv2.split(img)
                
                # Invert the color channels (Black 0 becomes White 255)
                # We leave 'a' (Alpha) untouched so the background stays transparent!
                b_inv = 255 - b
                g_inv = 255 - g
                r_inv = 255 - r
                
                # Merge the inverted colors back with the original transparency
                new_img = cv2.merge((b_inv, g_inv, r_inv, a))
                
                # Overwrite the original image
                cv2.imwrite(filepath, new_img)
                print(f"✅ Inverted and saved: {filename}")
            else:
                # If it's a JPG or a PNG without transparency, just invert the whole thing
                new_img = cv2.bitwise_not(img)
                cv2.imwrite(filepath, new_img)
                print(f"✅ Inverted (No Transparency): {filename}")

    print("\n🎉 All gesture icons have been converted to Dark Mode (White)!")