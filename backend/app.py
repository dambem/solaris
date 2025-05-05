from gradio_client import Client
import os
import shutil

client = Client("hysts/Shap-E")
result = client.predict(
		prompt="show me a baby, as if from solaris",
		seed=0,
		guidance_scale=15,
		num_inference_steps=64,
		api_name="/text-to-3d"
)
print(result)

os.rename(result, "models/model.glb")


# we need to move the model to be seen here - then proceed to do an animation  of it being lifted out of the depth