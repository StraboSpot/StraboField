#import "RCTAppDependencyProvider.h"

@implementation RCTAppDependencyProvider

- (NSArray<NSString *> *)imageURLLoaderClassNames {
  return @[];
}

- (NSArray<NSString *> *)imageDataDecoderClassNames {
  return @[];
}

- (NSArray<NSString *> *)URLRequestHandlerClassNames {
  return @[];
}

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup {
  return @[];
}

- (NSDictionary<NSString *, Class> *)thirdPartyFabricComponents {
  return @{};
}

- (NSDictionary<NSString *, id> *)moduleProviders {
  return @{};
}

@end
