// Fill out your copyright notice in the Description page of Project Settings.

#pragma once
#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "DynamicImageLoader.generated.h"

UCLASS()
class MODELVIEWER_API UDynamicImageLoader : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()
public:
	UDynamicImageLoader();
	~UDynamicImageLoader();
	UFUNCTION(BlueprintCallable, Category = "Image Loading")
	static UTexture2D* LoadTextureFromDisk(const FString& FullFilePath);
};
