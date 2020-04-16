import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';

import Icon from 'components/Icon';

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
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const popupRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleEditorFocus = (editor, annotation) => {
      if (annotation instanceof window.Annotations.FreeTextAnnotation) {
        const position = getAnnotationPopupPositionBasedOn(annotation, popupRef);
        setPosition(position);
        dispatch(actions.openElements(['richTextPopup']));
      }
    };

    core.addEventListener('editorFocus', handleEditorFocus);
    return () => core.removeEventListener('editorFocus', handleEditorFocus);
  }, [dispatch]);

  useEffect(() => {
    const handleEditorBlur = () => {
      dispatch(actions.closeElements(['richTextPopup']));
    };

    core.addEventListener('editorBlur', handleEditorBlur);
    return () => core.removeEventListener('editorBlur', handleEditorBlur);
  }, [dispatch]);

  return isDisabled ? null : (
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
      style={{ ...position }}
      // prevent the blur event from being triggered when clicking on toolbar buttons
      // otherwise we can't style the text since a blur event is triggered before a click event
      onMouseDown={e => e.preventDefault()}
    >
      <button className="ql-bold" data-element="richTextBoldButton">
        <Icon glyph="icon-text-bold" />
      </button>
      <button className="ql-italic" data-element="richTextItalicButton">
        <Icon glyph="icon-text-italic" />
      </button>
      <button className="ql-underline" data-element="richTextUnderlineButton">
        <Icon glyph="ic_annotation_underline_black_24px" />
      </button>
      <button className="ql-strike" data-element="richTextStrikeButton">
        <Icon glyph="ic_annotation_strikeout_black_24px" />
      </button>
    </div>
  );
};

export default RichTextPopup;
