import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import classNames from 'classnames';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import Icon from 'components/Icon';
import Tooltip from 'components/Tooltip';
import ColorPalette from 'components/ColorPalette';

import core from 'core';
import { isMobileDevice } from 'helpers/device';
import getRichTextPopupPosition from 'helpers/getRichTextPopupPosition';
import actions from 'actions';
import selectors from 'selectors';

import './RichTextPopup.scss';

const RichTextPopup = () => {
  const [isDisabled, isOpen] = useSelector(
    state => [
      selectors.isElementDisabled(state, 'richTextPopup'),
      selectors.isElementOpen(state, 'richTextPopup'),
    ],
    shallowEqual
  );
  const [cssPosition, setCssPosition] = useState({ left: 0, top: 0 });
  const [draggablePosition, setDraggablePosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState(null);
  const popupRef = useRef(null);
  const editorRef = useRef(null);
  const annotationRef = useRef(null);
  const selectionRef = useRef([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSelectionChange = (range, oldRange, source) => {
      selectionRef.current = [range, oldRange, source];

      if (range && editorRef.current) {
        const { index, length } = range;
        const format = editorRef.current.getFormat(index, length);

        if (typeof format.color === 'string') {
          const color = new window.Annotations.Color(format.color);

          setColor(color);
        } else if (Array.isArray(format.color)) {
          // the selection contains multiple color, so we set the current color to null
          setColor(null);
        } else if (!format.color) {
          setColor(annotationRef.current.TextColor);
        }
      }
    };

    core.addEventListener('editorSelectionChanged', handleSelectionChange);
    return () => core.removeEventListener('editorSelectionChanged', handleSelectionChange);
  }, []);

  useEffect(() => {
    const handleTextChange = () => {
      if (annotationRef.current?.isAutoSized()) {
        const position = getRichTextPopupPosition(annotationRef.current, popupRef);
        setCssPosition(position);
      }
    };

    core.addEventListener('editorTextChanged', handleTextChange);
    return () => core.removeEventListener('editorTextChanged', handleTextChange);
  }, []);

  useEffect(() => {
    const handleEditorFocus = (editor, annotation) => {
      if (annotation instanceof window.Annotations.FreeTextAnnotation) {
        const position = getRichTextPopupPosition(annotation, popupRef);
        setCssPosition(position);
        // when the editor is focused, we want to reset any previous drag movements so that
        // the popup will be positioned centered to the editor
        setDraggablePosition({ x: 0, y: 0 });

        editorRef.current = editor;
        annotationRef.current = annotation;

        dispatch(actions.openElements(['richTextPopup']));
      }
    };

    core.addEventListener('editorFocus', handleEditorFocus);
    return () => core.removeEventListener('editorFocus', handleEditorFocus);
  }, [dispatch]);

  useEffect(() => {
    const handleEditorBlur = () => {
      dispatch(actions.closeElements(['richTextPopup']));
      editorRef.current = null;
      annotationRef.current = null;
    };

    core.addEventListener('editorBlur', handleEditorBlur);
    return () => core.removeEventListener('editorBlur', handleEditorBlur);
  }, [dispatch]);

  const handleColorChange = (_, color) => {
    setColor(color);
    const { index, length } = editorRef.current.getSelection();

    if (length) {
      editorRef.current.formatText(index, length, { color: color.toHexString() });
    } else {
      editorRef.current.format('color', color.toHexString());
    }
  };

  const syncDraggablePosition = (e, { x, y }) => {
    setDraggablePosition({ x, y });
  };

  const handleMobileClick = format => () => {
    // during some testing we found that tapping on the format buttons occasionally removes the selection in the editor
    // which will cause the current selected range to be null, and thus the format are not being applied
    // this function work around this issue by re-selecting the previous selected range, and apply the format
    const [range, oldRange, source] = selectionRef.current;

    if (isMobileDevice && range === null && oldRange && source === 'user') {
      const editor = editorRef.current;
      const { index, length } = oldRange;

      editor.focus();
      editor.setSelection(index, length);

      const currentFormat = editor.getFormat(index, length);
      const shouldFormat = !currentFormat[format];

      if (length) {
        editor.formatText(index, length, format, shouldFormat);
      } else {
        editor.format(format, shouldFormat);
      }
    }
  };

  return isDisabled ? null : (
    <Draggable
      position={draggablePosition}
      onDrag={syncDraggablePosition}
      onStop={syncDraggablePosition}
      enableUserSelectHack={false}
      // don't allow drag when clicking on a button element or a color cell
      cancel="button, .cell"
      // prevent the blur event from being triggered when clicking on toolbar buttons
      // otherwise we can't style the text since a blur event is triggered before a click event
      onMouseDown={e => {
        if (e.type !== 'touchstart') {
          e.preventDefault();
        }
      }}
    >
      <div
        id="ql-toolbar"
        className={classNames({
          Popup: true,
          RichTextPopup: true,
          open: isOpen,
          closed: !isOpen,
        })}
        ref={popupRef}
        data-element="richTextPopup"
        style={{ ...cssPosition }}
      >
        <div className="rich-text-format">
          <Tooltip content="option.richText.bold">
            <button
              className="ql-bold"
              data-element="richTextBoldButton"
              onClick={handleMobileClick('bold')}
            >
              <Icon glyph="icon-text-bold" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.italic">
            <button
              className="ql-italic"
              data-element="richTextItalicButton"
              onClick={handleMobileClick('italic')}
            >
              <Icon glyph="icon-text-italic" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.underline">
            <button
              className="ql-underline"
              data-element="richTextUnderlineButton"
              onClick={handleMobileClick('underline')}
            >
              <Icon glyph="ic_annotation_underline_black_24px" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.strikeout">
            <button
              className="ql-strike"
              data-element="richTextStrikeButton"
              onClick={handleMobileClick('strike')}
            >
              <Icon glyph="ic_annotation_strikeout_black_24px" />
            </button>
          </Tooltip>
        </div>
        <ColorPalette color={color} property="TextColor" onStyleChange={handleColorChange} />
      </div>
    </Draggable>
  );
};

export default RichTextPopup;
