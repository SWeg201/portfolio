# Unreal_DynamicImageLoader

A lightweight Unreal Engine C++ utility for dynamically loading and displaying images at runtime. Can be expanded to support more image formats.

## Files
- `DynamicImageLoader.cpp`
- `DynamicImageLoader.h`

## How it works
This uses UTexture2D + dynamic material instance to load .png/.jpg from disk and display them in UMG widgets at runtime.
It supports dynamic image replacement even after the product has been built and shipped — for example, in a model viewer.
This gives the user / customer full control over making changes to the text and image content later on, without the need for manual adjustment by the development team. 
Optionally, the loader can work in tandem with a .json file to define image sources or metadata. 
