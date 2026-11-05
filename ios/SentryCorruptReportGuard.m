#import "SentryCorruptReportGuard.h"

#import <objc/runtime.h>

extern void sentrycrash_deleteReportWithID(int64_t reportID);

// SentryCrash decodes saved crash reports with KeepPartialObject, so a half-written report can decode to an NSArray.
// reportWithIntID: then throws during Sentry startup, on every launch, because the report is never deleted. Sentry
// ships as a prebuilt xcframework, so wrap the method instead of patching its source. Upstream still has this bug as of
// sentry-cocoa 9.32.0; remove this once it's fixed there.
@implementation SentryCorruptReportGuard

+ (void)install
{
    SEL selector = NSSelectorFromString(@"reportWithIntID:");
    Class crashClass = NSClassFromString(@"SentryCrash");
    Method method = crashClass ? class_getInstanceMethod(crashClass, selector) : NULL;
    NSAssert(method != NULL, @"SentryCrash reportWithIntID: not found; update or remove SentryCorruptReportGuard");
    if (method == NULL) return;

    typedef NSDictionary * (*ReportLoader)(id, SEL, int64_t);
    ReportLoader original = (ReportLoader) method_getImplementation(method);

    id replacement = ^NSDictionary *(id crash, int64_t reportID) {
        @try {
            NSDictionary *report = original(crash, selector, reportID);
            if (report == nil || [report isKindOfClass:[NSDictionary class]]) return report;
        } @catch (NSException *exception) {
            NSLog(@"Could not load crash report %lld: %@", reportID, exception.reason);
        }
        sentrycrash_deleteReportWithID(reportID);
        return nil;
    };
    method_setImplementation(method, imp_implementationWithBlock(replacement));
}

@end
