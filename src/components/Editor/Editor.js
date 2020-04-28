import React from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorState, RichUtils } from 'draft-js';
import './Editor.scss';

const propTypes = {
  placeholder: PropTypes.string,
  className: PropTypes.string
};

/**
 * CustomEditor  using draft-js
 * Includes RTE functionality
 * current library used in DPH
 */
class CustomEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { editorState: EditorState.createEmpty() };
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = this.handleKeyCommand.bind(this);

  }

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  render() {
    return (
      <Editor
        className={this.props.className} 
        editorState={this.state.editorState} 
        handleKeyCommand={this.handleKeyCommand}
        onChange={this.onChange} 
        placeholder={this.props.placeholder ? this.props.placeholder : 'Enter comment here...'}
      />
    );
  }
}

CustomEditor.propTypes = propTypes;

export default CustomEditor;