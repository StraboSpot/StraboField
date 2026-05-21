import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import ReportMetadata from './ReportMetadata';
import {
  MEDIUMGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
} from '../../shared/styles.constants';
import SectionDivider from '../../shared/ui/SectionDivider';

const ReportComments = ({comments, isReadOnlyProject, onSaveComment}) => {
  /* Local State */

  const [commentText, setCommentText] = useState('');

  /* Event Handlers */

  const handleSaveComment = () => {
    if (commentText.trim()) {
      onSaveComment(commentText.trim());
      setCommentText('');
    }
  };

  /* View */

  return (
    <View>
      <SectionDivider dividerText={'Comments'}/>
      {comments.map(comment => (
        <View key={comment.id} style={styles.commentItem}>
          <Text style={styles.commentText}>{comment.text}</Text>
          <ReportMetadata createdBy={comment.name} createdTimestamp={comment.created_timestamp}/>
        </View>
      ))}
      {!isReadOnlyProject && (
        <View style={styles.newCommentContainer}>
          <View style={styles.inputRow}>
            <TextInput
              multiline
              onChangeText={setCommentText}
              placeholder={'Add a comment...'}
              style={styles.textInput}
              value={commentText}
            />
            <TouchableOpacity onPress={handleSaveComment} style={styles.sendButton}>
              <Icon color={PRIMARY_ACCENT_COLOR} name={'send'} type={'material-community'}/>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  commentItem: {
    borderBottomColor: MEDIUMGREY,
    borderBottomWidth: 1,
    paddingTop: 4,
  },
  commentText: {
    color: PRIMARY_TEXT_COLOR,
    fontSize: PRIMARY_TEXT_SIZE,
    paddingHorizontal: 10,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  newCommentContainer: {
    padding: 10,
  },
  sendButton: {
    marginLeft: 8,
  },
  textInput: {
    borderColor: MEDIUMGREY,
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 5,
    paddingVertical: 5,
    textAlignVertical: 'top',
  },
});

export default ReportComments;
