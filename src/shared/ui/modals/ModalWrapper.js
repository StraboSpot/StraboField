import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Keyboard, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {FlatList, GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';

import ModalWrapperHeader from './ModalWrapperHeader';
import overlayStyles from './overlay.styles';
import {SHORTCUT_MODALS} from '../../../modules/page/page.constants';
import commonStyles from '../../common.styles';
import {isEmpty} from '../../helpers';
import {MODAL_WIDTH, SMALL_SCREEN} from '../../styles.constants';
import {AvatarWrapper} from '../avatars';
import ModalSaveAndCancelButtons from '../modals/ModalSaveAndCancelButtons';

// Body fills a fullscreen/small-screen modal; shrinks-to-content (and scrolls past the cap) in a
// max-height-capped centered modal.
const FILL_FLEX = {flex: 1};
const CONTENT_SIZED_FLEX = {flexShrink: 1};

// Filled modals get a definite, keyboard-aware height so their body can flex and their footer stays
// sticky. Keep some breathing room from the screen/keyboard edges, and a floor so they stay usable.
const FILLED_MODAL_MARGIN = 32;
const MIN_FILLED_MODAL_HEIGHT = 220;

const ModalWrapper = ({
                        actionTitle,
                        backdropStyle,
                        buttonTitleRight,
                        cancelTitle,
                        children,
                        closeModal,
                        disabled,
                        doesRenderAsView,
                        fullscreen,
                        headerImage,
                        headerTitle,
                        isChildrenFilled = false,
                        isContentSized = false,
                        isHideHeader = false,
                        isLoading,
                        imageStyle,
                        isVisible,
                        onActionPressed,
                        onBackdropPress,
                        onDismiss,
                        onCancelPress,
                        onDeletePress,
                        onFooterButtonPress,
                        overlayStyleOverride,
                        scrollEnabled = true,
                        showActionButton,
                        showCancelButton,
                        showCloseButton,
                        showDeleteButton,
                      }) => {
  /* Data Hooks */

  const footerShortcutModal = useSelector((state) => {
    if (isEmpty(state.spot.selectedSpot) || !isEmpty(state.spot.selectedAttributes)) return null;
    return SHORTCUT_MODALS.find(m => m.key === state.home.modalVisible && m.notebook_modal_key) ?? null;
  });

  const {height: windowHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /* Local State */

  const childrenRef = useRef(children);
  childrenRef.current = children;
  const [kbOffset, setKbOffset] = useState(0);

  /* Derived Variables */

  // `isLoading` means an action is mid-flight, so close off both exits. Nothing here cancels the work — dismissing
  // only hides the UI while it keeps running — so leaving mid-action invites duplicate or racing operations.
  const canDismiss = !isLoading;
  const isCloseButtonShown = canDismiss && (showCloseButton || showCancelButton !== false);

  // Clear whichever obstruction is taller: the keyboard when one is open, otherwise the navigation bar. Android
  // 15+ forces edge-to-edge, so a fullscreen modal draws behind the navigation bar and its footer buttons become
  // untappable, and a Modal is its own native window so the app's SafeAreaView can't inset it.
  const fullscreenPaddingBottom = Math.max(kbOffset, insets.bottom);

  /* Side Effects */

  // Track the keyboard height for Android small-screen modals (their fullscreen Modal doesn't inset
  // the content), and for any filled-children modal (whose body is a plain View, not a
  // keyboard-inset FlatList) so its sticky footer stays above the keyboard.
  useEffect(() => {
    const isAndroidSmall = Platform.OS === 'android' && SMALL_SCREEN;
    if (!isChildrenFilled && !isAndroidSmall) return;
    const show = Keyboard.addListener('keyboardDidShow', e => setKbOffset(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbOffset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [isChildrenFilled]);

  /* Event Handlers */

  // Android's back button and back gesture both land here; without it the modal ignores them entirely. Callers
  // must clear `isLoading` on every path (a `finally`), or the modal has no exit at all while it is set.
  const handleRequestClose = () => {
    if (canDismiss) (onBackdropPress || closeModal || onCancelPress)?.();
  };

  /* Logic Helpers */

  const getResponsiveOverlayStyle = () => {
    if (fullscreen) return overlayStyles.overlayContainerFullScreen;

    if (isChildrenFilled) {
      // Definite height so the body flexes and the footer stays sticky. When the keyboard is open,
      // fill the space above it; otherwise use the caller's preferred fraction (from `maxHeight`).
      // Either way, never exceed the space above the keyboard so nothing is covered in any orientation.
      const {height: _overrideHeight, maxHeight: overrideMaxHeight, flex: _overrideFlex, ...restOverride}
        = overlayStyleOverride || {};
      const availableHeight = windowHeight - kbOffset;
      const preferredFraction = typeof overrideMaxHeight === 'string' && overrideMaxHeight.endsWith('%')
        ? parseFloat(overrideMaxHeight) / 100 : 0.85;
      const preferredHeight = kbOffset > 0 ? availableHeight : windowHeight * preferredFraction;
      const height = Math.max(
        MIN_FILLED_MODAL_HEIGHT,
        Math.min(preferredHeight, availableHeight) - FILLED_MODAL_MARGIN,
      );
      return {...overlayStyles.overlayContainer, height, minWidth: MODAL_WIDTH, ...restOverride};
    }

    // Treat any caller-provided fixed `height` (e.g. '80%') as a max so the modal shrinks to its
    // content; cap at 85% of the screen by default so it never runs off the top/bottom.
    const {height: overrideHeight, ...restOverride} = overlayStyleOverride || {};
    const maxHeight = restOverride.maxHeight
      ?? (overrideHeight && overrideHeight !== 'auto' ? overrideHeight : windowHeight * 0.85);
    return {...overlayStyles.overlayContainer, maxHeight, minWidth: MODAL_WIDTH, ...restOverride};
  };

  /* Render Functions */

  const renderListHeader = useCallback(() => <>{childrenRef.current}</>, []);

  const renderModalBottom = () => {
    if (!footerShortcutModal) return null;
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        onPress={() => onFooterButtonPress(footerShortcutModal.notebook_modal_key)}
      >
        <AvatarWrapper
          size={20}
          source={require('../../../assets/icons/NotebookView_pressed.png')}
        />
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>Go to Last Spot Created</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  // `bodyFlexStyle` follows the container: fullscreen/small-screen modals fill (flex), while
  // content-sized (max-height-capped) modals use flexShrink so the body shrinks to its content
  // and only scrolls once it hits the cap.
  const renderModalContent = (bodyFlexStyle = FILL_FLEX) => (
    <>
      <ModalWrapperHeader
        buttonTitleRight={buttonTitleRight}
        closeModal={closeModal || onCancelPress}
        headerImage={headerImage}
        headerTitle={headerTitle}
        imageStyle={imageStyle}
        showCloseButton={isCloseButtonShown}
      />
      {isChildrenFilled ? (
        // Fill the body with the children (which manage their own internal scrolling) so the footer
        // below stays sticky. Keyboard handling comes from the kbOffset padding on the container.
        <View style={FILL_FLEX}>{childrenRef.current}</View>
      ) : (
        <FlatList
          ListHeaderComponent={renderListHeader}
          // ListHeaderComponent={() => <>{children}</>}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          data={[]}
          keyExtractor={(_, index) => index.toString()}
          keyboardShouldPersistTaps={'handled'}
          scrollEnabled={scrollEnabled}
          style={bodyFlexStyle}
        />
      )}
      {renderModalBottom()}
      <ModalSaveAndCancelButtons
        actionTitle={actionTitle}
        cancelTitle={cancelTitle}
        disabled={disabled}
        isLoading={isLoading}
        onActionPressed={onActionPressed}
        onCancelPress={onCancelPress}
        onDeletePress={onDeletePress}
        showActionButton={showActionButton}
        showCancelButton={showCancelButton}
        showDeleteButton={showDeleteButton}
      />
    </>
  );

  /* View */

  if (doesRenderAsView) {
    if (isVisible === false) return null;
    if (fullscreen) {
      return (
        <View style={[overlayStyles.overlayContainerFullScreen, viewOverlayStyles.fullscreenOverlay]}>
          <ModalWrapperHeader
            buttonTitleRight={buttonTitleRight}
            closeModal={closeModal || onCancelPress}
            headerImage={headerImage}
            headerTitle={headerTitle}
            imageStyle={imageStyle}
            showCloseButton={isCloseButtonShown}
          />
          <View style={{flex: 1}}>
            {children}
          </View>
        </View>
      );
    }
    return (
      <View style={viewOverlayStyles.backdrop}>
        <Pressable onPress={onBackdropPress} style={StyleSheet.absoluteFill}/>
        <View style={getResponsiveOverlayStyle()}>
          {renderModalContent(CONTENT_SIZED_FLEX)}
        </View>
      </View>
    );
  }

  // Small screens go fullscreen unless the caller asked for a content-sized modal (e.g. a short
  // message), which stays centered and only as tall as its content at every screen size.
  if (SMALL_SCREEN && !isContentSized) {
    return (
      <Modal
        animationType={'fade'}
        onDismiss={onDismiss}
        onRequestClose={handleRequestClose}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}
        visible={isVisible}
      >
        <GestureHandlerRootView style={{flex: 1}}>
          <View style={[overlayStyles.overlayContainerFullScreen, {paddingBottom: fullscreenPaddingBottom}]}>
            {renderModalContent()}
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  // Large-screen modal. Use a plain RN Modal with our own centered backdrop instead of the rn-vui
  // Overlay: the Overlay wraps content in a KeyboardAvoidingView (behavior 'padding' on iOS) that
  // re-centers the modal when the keyboard opens, pushing the top (and any focused field) off-screen.
  // Without it the modal stays put and each form's keyboard-aware FlatList scrolls the focused field
  // above the keyboard.
  const bodyFlexStyle = fullscreen || isChildrenFilled ? FILL_FLEX : CONTENT_SIZED_FLEX;
  const overlayBody = (
    <View style={getResponsiveOverlayStyle()}>
      {Platform.OS === 'android' ? (
          <GestureHandlerRootView style={bodyFlexStyle}>
            {renderModalContent(bodyFlexStyle)}
          </GestureHandlerRootView>
        )
        : renderModalContent(bodyFlexStyle)}
    </View>
  );

  return (
    <Modal
      animationType={'fade'}
      onDismiss={onDismiss}
      onRequestClose={handleRequestClose}
      supportedOrientations={['portrait', 'landscape']}
      transparent
      visible={isVisible}
    >
      {fullscreen ? overlayBody : (
        <View
          pointerEvents={'box-none'}
          style={[viewOverlayStyles.modalCentered, isChildrenFilled && {paddingBottom: kbOffset}]}
        >
          <Pressable
            onPress={onBackdropPress}
            style={[StyleSheet.absoluteFill, backdropStyle || overlayStyles.backdropStyles]}
          />
          {overlayBody}
        </View>
      )}
    </Modal>
  );
};

const viewOverlayStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    zIndex: 100,
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  modalCentered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(ModalWrapper);
