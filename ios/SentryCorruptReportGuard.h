#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SentryCorruptReportGuard : NSObject

// Call before Sentry starts.
+ (void)install;

@end

NS_ASSUME_NONNULL_END
