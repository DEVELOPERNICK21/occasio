#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE (OccasioWidgets, NSObject)

RCT_EXTERN_METHOD(setSnapshot : (NSString *)json resolver : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clear : (RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject)

@end
