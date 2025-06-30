#include "DynamicImageLoader.h"
#include "IImageWrapper.h"
#include "IImageWrapperModule.h"
#include "Modules/ModuleManager.h"
#include "Misc/FileHelper.h"
#include "Engine/Texture2D.h"

// Loads Image File (JPEG or PNG) and creates UTexture2D
UTexture2D* UDynamicImageLoader::LoadTextureFromDisk(const FString& FullFilePath)
{
    TArray<uint8> FileData;

    // Load Image as Byte-Array
    if (!FFileHelper::LoadFileToArray(FileData, *FullFilePath)) {
        UE_LOG(LogTemp, Warning, TEXT("Failed to load file: %s"), *FullFilePath);
        return nullptr;
    }

    // Load ImageWrapper-Module
    IImageWrapperModule& ImageWrapperModule = FModuleManager::LoadModuleChecked<IImageWrapperModule>(FName("ImageWrapper"));

    // Supported Formats: PNG & JPEG
    TArray<EImageFormat> SupportedFormats = {
        EImageFormat::PNG,
        EImageFormat::JPEG
    };

    for (EImageFormat Format : SupportedFormats)
    {
        TSharedPtr<IImageWrapper> ImageWrapper = ImageWrapperModule.CreateImageWrapper(Format);

        if (ImageWrapper.IsValid() && ImageWrapper->SetCompressed(FileData.GetData(), FileData.Num()))
        {
            TArray64<uint8> RawData;
            if (ImageWrapper->GetRaw(ERGBFormat::BGRA, 8, RawData))
            {
                int32 Width = ImageWrapper->GetWidth();
                int32 Height = ImageWrapper->GetHeight();

                UTexture2D* Texture = UTexture2D::CreateTransient(Width, Height, PF_B8G8R8A8);
                if (!Texture) return nullptr;

                void* TextureData = Texture->GetPlatformData()->Mips[0].BulkData.Lock(LOCK_READ_WRITE);
                FMemory::Memcpy(TextureData, RawData.GetData(), RawData.Num());
                Texture->GetPlatformData()->Mips[0].BulkData.Unlock();

                Texture->UpdateResource();
                Texture->AddToRoot();

                return Texture;
            }
        }
    }

    UE_LOG(LogTemp, Warning, TEXT("Failed to decode image: %s"), *FullFilePath);
    return nullptr;
}

UDynamicImageLoader::UDynamicImageLoader()
{
}

UDynamicImageLoader::~UDynamicImageLoader()
{
}
