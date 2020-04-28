// Components
import React, { Component } from 'react';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { FilePond, registerPlugin } from 'react-filepond';

// Classes
import './AttachmentUpload.scss';

// Constants
const uuidv4 = require('uuid/v4');

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

class AttachmentUpload extends Component {
  constructor(props) {
    super(props);
    this.maxFileSizeInBytes = 9990000000;
    this.maxFileSizeForFilePond = '999MB';
  }

    processUploadedFiles = fileItems => {
      var uploadedFiles = [];
      for (var i = 0; i < fileItems.length; i++) {
        var fileName = uuidv4().toUpperCase() + '-' + fileItems[i].file.name.replace(/\s+/g, '-');
        uploadedFiles.push({ 'attachmentId': fileName, 'displayFilename': fileItems[i].file.name, 'fileContent': fileItems[i].file, 'attachmentDisplayName': fileItems[i].file.name });
      }
      console.log("uploaded file(s) to be saved", JSON.stringify(uploadedFiles));
    }

    processFile = (fieldName, file, metadata, load, error, progress, abort) => {

      var fileName = uuidv4().toUpperCase() + '-' + file.name.replace(/\s+/g, '-');
      console.log('fileName to be stored', fileName);
    }

    storeAttachmentsProgress = (progressMade, progress) => {
      progress(true, progressMade.loaded, progressMade.total);
    }

    storeAttachmentsSuccess = (result, load) => {
      load(result.key);
    }

    storeAttachmentsFailure = (result, file, error) => {
      console.error('error in uploading file via document storage service', result);
      error();
    }

    render() {
      return  (
        <FilePond   
          allowMultiple
          allowRevert={false}
          allowDrop
          allowBrowse
          allowPaste
          instantUpload={false}
          allowFileTypeValidation
          acceptedFileTypes={this.acceptedFileTypes}
          allowFileSizeValidation
          maxFileSize={this.maxFileSizeForFilePond}
          dropOnPage
          dropValidation
          beforeDropFile={this.isFileNameValid}
          onupdatefiles={this.processUploadedFiles}
          server={{
            process:(fieldName, file, metadata, load, error, progress, abort) => {
              this.processFile(fieldName, file, metadata, load, error, progress, abort);
            }
          }}
          labelTapToCancel={''}
          labelTapToRetry={''}
          labelTapToUndo={''}
        >
        </FilePond>
      );
    }
}

export default AttachmentUpload;