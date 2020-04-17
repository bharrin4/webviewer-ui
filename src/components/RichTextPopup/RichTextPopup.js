import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import classNames from 'classnames';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import Icon from 'components/Icon';
import Tooltip from 'components/Tooltip';
import ColorPalette from 'components/ColorPalette';

import core from 'core';
import { getAnnotationPopupPositionBasedOn } from 'helpers/getPopupPosition';
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
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSelectionChanged = range => {
      if (range) {
        const { index, length } = range;
        const format = editorRef.current.getFormat(index, length);

        if (typeof format.color === 'string') {
          const color = new window.Annotations.Color(format.color);

          setColor(color);
        } else if (Array.isArray(format.color) || !format.color) {
          // the selection contains multiple color, so we set the current color to null
          setColor(null);
        }
      }
    };

    core.addEventListener('editorSelectionChanged', handleSelectionChanged);
    return () => core.removeEventListener('editorSelectionChanged', handleSelectionChanged);
  }, []);

  useEffect(() => {
    const handleEditorFocus = (editor, annotation) => {
      if (annotation instanceof window.Annotations.FreeTextAnnotation) {
        const position = getAnnotationPopupPositionBasedOn(annotation, popupRef);
        setCssPosition(position);
        // when the editor is focused, we want to reset any previous drag movements so that
        // the popup will be positioned centered to the editor
        setDraggablePosition({ x: 0, y: 0 });

        editorRef.current = editor;
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

  return isDisabled ? null : (
    <Draggable
      position={draggablePosition}
      onDrag={syncDraggablePosition}
      onStop={syncDraggablePosition}
      enableUserSelectHack={false}
      // prevent the blur event from being triggered when clicking on toolbar buttons
      // otherwise we can't style the text since a blur event is triggered before a click event
      onMouseDown={e => e.preventDefault()}
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
            <button className="ql-bold" data-element="richTextBoldButton">
              <Icon glyph="icon-text-bold" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.italic">
            <button className="ql-italic" data-element="richTextItalicButton">
              <Icon glyph="icon-text-italic" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.underline">
            <button className="ql-underline" data-element="richTextUnderlineButton">
              <Icon glyph="ic_annotation_underline_black_24px" />
            </button>
          </Tooltip>
          <Tooltip content="option.richText.strikeout">
            <button className="ql-strike" data-element="richTextStrikeButton">
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
