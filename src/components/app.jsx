import React, { useState, useEffect } from 'react';
import moment from 'moment';
import _ from 'lodash';
import Airtable from 'airtable';
const base = new Airtable({ apiKey: 'keyCxnlep0bgotSrX' }).base('appHXXoVD1tn9QATh');
import Papa from 'papaparse'; // using Papaparse library for FileReader and parsing to Json

import Header from './header';
import Footer from './footer';
import Modal from './modal';

function clientsReducer(state, action) {
  return [...state, ...action];
}

/* globals $ */
function App() {
  // for single-client-select
  // const [selectedClient, setSelectedClient] = useState(null);
  const [activities, setActivities] = useState([]);

  const [surveyId, setSurveyId] = useState('');
  const [helpMessage, setHelpMessage] = useState('');

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [challengeId, setChallengeId] = useState(null); // adding this in case we use the app for updating tiles. Could be fancy.
  const [imageUrl, setImageUrl] = useState('https://images.limeade.com/PDW/805d6a9d-186e-4462-8fe2-ca97a478ffca-large.jpg');
  const [title, setTitle] = useState('Uploaded from Eight Wolves');
  const [activityText, setActivityText] = useState('test the upload');
  const [shortDescription, setShortDescription] = useState('Test upload from Eight Wolves.');
  const [longDescription, setLongDescription] = useState('<p>So many wolves.</p>');

  const [allowSelfReport, setAllowSelfReport] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState(1);
  const [challengeType, setChallengeType] = useState('OneTimeEvent');
  const [defaultPrivacy, setDefaultPrivacy] = useState(0);
  const [displayPriority, setDisplayPriority] = useState(null);
  const [enableDeviceTracking, setEnableDeviceTracking] = useState(0);
  const [eventCode, setEventCode] = useState(null); // adding this in case we ever need it

  const [isFeatured, setIsFeatured] = useState(0);
  const [isWeekly, setIsWeekly] = useState(0);

  const [isTeamChallenge, setIsTeamChallenge] = useState(0);
  const [minTeamSize, setMinTeamSize] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('');

  const [partnerId, setPartnerId] = useState(0);

  const [pointValue, setPointValue] = useState(0);

  // Targeting state values
  const [subgroup, setSubgroup] = useState(null);
  const [field1, setField1] = useState(null);
  const [field1Value, setField1Value] = useState(null);
  const [field2, setField2] = useState(null);
  const [field2Value, setField2Value] = useState(null);
  const [field3, setField3] = useState(null);
  const [field3Value, setField3Value] = useState(null);

  // clients csv state
  const [clientsFromCsv, setClientsFromCsv] = useState(null);

  const [clients, dispatch] = React.useReducer(
    clientsReducer,
    [] // initial clients
  );

  // When app first mounts, fetch clients
  useEffect(() => {

    base('Clients').select().eachPage((records, fetchNextPage) => {
      dispatch(records);

      fetchNextPage();
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

  }, []); // Pass empty array to only run once on mount

  function handleClientsCsvFiles(e) {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: function(results) {
        console.log('Clients:', results.data);
        setClientsFromCsv(results.data);
      }
    });
  }

  function renderClients() {
    const accountNamesList = clientsFromCsv.map(client => client['Account'].toLowerCase());

    // Filter clients by the list of account names in the user uploaded CSV
    const filteredClients = clients.filter(client => {
      return accountNamesList.includes(client.fields['Salesforce Name'].toLowerCase());
    });

    const sortedClients = [...filteredClients];
    console.log('sortedClients:', sortedClients);
    if (clientsFromCsv.length !== sortedClients.length) {
      console.error('Clients list does not match! Check clients csv to ensure its Account names match Salesforce Name in Clients (Most up to Date)');
      // compile list of unmatched clients
      const filteredClientsNamesList = filteredClients.map(filteredClient => filteredClient.fields['Salesforce Name'].toLowerCase()).sort();
      const missingClients = _.difference(accountNamesList, filteredClientsNamesList);
      console.log('missingClients (shown as lowercase since the comparison is made with toLowercase():', missingClients);
    } else {
      console.log('Clients csv matches sortedClients. Carry on.');
    }

    // // removing sorting for now so table order matches .csv order
    // sortedClients.sort((a, b) => {
    //   const nameA = a.fields['Salesforce Name'].toLowerCase();
    //   const nameB = b.fields['Salesforce Name'].toLowerCase();
    //   if (nameA < nameB) {
    //     return -1;
    //   }
    //   if (nameA > nameB) {
    //     return 1;
    //   }
    //   return 0;
    // });

    return sortedClients.map((client) => {
      const employerName = client.fields['Limeade e='];

      return (
        <tr id={employerName.replace(/\s*/g, '')} key={employerName}>
          <td>
            <a href={client.fields['Domain'] + '/ControlPanel/RoleAdmin/ViewChallenges.aspx?type=employer'} target="_blank">{client.fields['Salesforce Name']}</a>
          </td>
          <td className="challenge-id"></td>
          <td className="status"></td>
          <td>
            <button type="button" className="btn btn-primary" onClick={() => uploadChallenge(client)}>Upload</button>
          </td>
        </tr>
      );
    });

  }

  function handleChallengesCsvFiles(e) {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function(results) {
        console.log('Challenges:', results.data);

        // parse the challenges csv and update the state values
        setChallengeId(results.data[0].ChallengeId);
        setChallengeType(results.data[0].ChallengeType);
        setIsWeekly(results.data[0].IsWeekly);
        // skipping WinStrategy since the upload doesn't seem to need it
        setChallengeTarget(results.data[0].Target);
        setActivityText(results.data[0].Activity);
        setTitle(results.data[0].ChallengeName);
        setDisplayPriority(results.data[0].DisplayPriority);
        setStartDate(results.data[0].StartDate);
        setEndDate(results.data[0].EndDate);
        setShortDescription(results.data[0].ShortDescription);
        setLongDescription(results.data[0].MoreInformation);
        setImageUrl(results.data[0].ImageUrl);
        // skipping ShowInProgram since we determine it during upload
        // skipping RewardType because what is it even
        setPointValue(results.data[0].Reward);
        // skipping Dimensions becasue eff 'em
        // skipping Leaderboard
        setEnableDeviceTracking(results.data[0].EnableDeviceTracking);
        setAllowSelfReport(results.data[0].AllowSelfReporting);
        // skipping DeviceTrackingUnits, not sure where it fits in the upload
        setIsTeamChallenge(results.data[0].IsTeamChallenge);
        setMinTeamSize(results.data[0].MinTeamSize);
        setMaxTeamSize(results.data[0].MaxTeamSize);
        setSubgroup(results.data[0].Subgroup);
        setField1(results.data[0].Field1);
        setField1Value(results.data[0].Field1Value);
        setField2(results.data[0].Field2);
        setField2Value(results.data[0].Field2Value);
        setField3(results.data[0].Field3);
        setField3Value(results.data[0].Field3Value);
        // skipping Appearance
        setPartnerId(results.data[0].IntegrationPartnerId);
        // skipping ButtonText since we determine it during upload
        // skipping TargetUrl since we determine it during upload
        setEventCode(results.data[0].EventCode);
        // skipping ShowExtendedDescription since we determine it during upload
        // skipping ActivityTemplateId, what even is that
        setIsFeatured(results.data[0].IsFeatured);
        // skippingFeaturedDescription since we determine it during upload
        // skipping FeaturedImageUrl since we determine it during upload
        // skipping DailySelfReportLimit since it's rarely used
        setDefaultPrivacy(results.data[0].DefaultPrivacy);
      }
    });
  }

  function sanitize(code) {
    let sanitized = code
      .replace(/\r?\n|\r/g, ' ')     // Strip out carriage returns and newlines
      .replace(/\u2018/g, '\'')      // Left single quote
      .replace(/\u2019/g, '\'')      // Right single quote
      .replace(/\u201C/g, '"')       // Left double quote
      .replace(/\u201D/g, '"')       // Right double quote
      .replace(/\u2026/g, '...')     // Ellipsis
      .replace(/\u2013/g, '&ndash;') // Long dash
      .replace(/\u2014/g, '&mdash;') // Longer dash
      .replace(/\u00A9/g, '&copy;');  // Copyright symbol
    return sanitized;
  }

  // Show/Hide Heartbeat Survey textbox, and clear URL state if not checked
  function handleHeartbeatSurvey(e) {
    const heartbeat = document.querySelector('#heartbeatSurvey');
    if (document.querySelector('#toggleHeartbeatSurvey').checked) {
      heartbeat.style.display = 'block';
      setHelpMessage('${surveyUrl}'); // setting helpMessage so we can easily display the variable name that gets replaced to the user
    } else {
      heartbeat.style.display = 'none';
      setSurveyId('');
      setHelpMessage('');
    }
  }

  function handleSurveyId(e) {
    setSurveyId(e.target.value);
  }

  function massUpload() {
    // using rowId rather than the tr id so it can be incremented later, and so it's clearly different from challengeIndex
    let rowId = 0;
    // upload first challenge in challengesFromCsv
    massUploadChallenge(rowId);

    function massUploadChallenge(rowId) {
      // declaring client and employerName so this function's structure can match uploadChallenge()
      let client = {};
      const employerName = clientsFromCsv[rowId].Account;

      // let the user know that an upload is occurring
      $('#' + employerName + ' .status').html('Uploading...');

      // get the domain for the client from Airtable
      let psk = '';
      for (let i = 0; i < clients.length; i++) {
        if (clients[i].fields['Limeade e='] === employerName) {
          client = clients[i]; // set the client so the airtable data can be used for upload auth
          psk = client.fields['Limeade PSK'];
        }
      }

      // upload the challenge
      // basically just a copypaste of uploadChallenge() below
      let frequency = '';
      if (enableDeviceTracking === 1) {
        frequency = 'Daily';
      } else if (isWeekly === 1) {
        frequency = 'Weekly'; // this order is intentional, since Weekly Steps have Frequency of Weekly
      } else {
        frequency = 'None';
      }

      // most of the time, Activity Type is the activityText, unless it's a weekly units non-device challenge
      let activityType = '';
      if (enableDeviceTracking === 1 && isWeekly === 1) {
        activityType = '';
      } else {
        activityType = activityText;
      }

      let amountUnit = 'times';
      switch (enableDeviceTracking) {
        case 1:
          if (isWeekly === 0) {
            amountUnit = 'steps';
          } else if (isWeekly === 1) {
            amountUnit = activityText;
          }
          break;
        case 0:
          amountUnit = 'times';
          break;
      }

      // prepping for splitting tags for upload
      let tagValues1 = [];
      let tagValues2 = [];
      let tagValues3 = [];

      // conditionally setting the tags in case there are fewer than 3 targeting columns
      let tags = [];
      function makeTags() {
        field1 ? tags.push({
          'TagName': field1 ? field1 : '',
          'TagValues':
            field1Value ? tagValues1.concat(field1Value.split('|').map(tag => tag.trim())) : '' // splitting tags on the | like Limeade, also trimming out whitespace just in case
        }) : null;
        field2 ? tags.push({
          'TagName': field2 ? field2 : '',
          'TagValues':
            field2Value ? tagValues2.concat(field2Value.split('|').map(tag => tag.trim())) : ''
        }) : null;
        field3 ? tags.push({
          'TagName': field3 ? field3 : '',
          'TagValues':
            field3Value ? tagValues3.concat(field3Value.split('|').map(tag => tag.trim())) : ''
        }) : null;
        return tags;
      }

      const data = {
        'AboutChallenge': sanitize(longDescription),
        'ActivityReward': {
          'Type': 'IncentivePoints',
          'Value': pointValue
        },
        'ActivityType': activityType, // Activity in csv, except for definition above
        'AmountUnit': amountUnit,
        'ButtonText': partnerId === 1 ? 'CLOSE' : '',
        'ChallengeLogoThumbURL': imageUrl,
        'ChallengeLogoURL': imageUrl,
        'ChallengeTarget': challengeTarget, // Target in csv
        'ChallengeType': challengeType, // ChallengeType in csv
        'Dimensions': [],
        'DefaultPrivacyFlag': defaultPrivacy === 0 ? 'Unspecified': 1,
        'DisplayInProgram': startDate === moment().format('YYYY-MM-DD') ? true : false,  // sets true if the challenge starts today
        'DisplayPriority': displayPriority,
        'EndDate': endDate,
        'EventCode': eventCode,
        'Frequency': frequency,
        'IsDeviceEnabled': enableDeviceTracking === 1 ? true : false, // EnableDeviceTracking in csv
        'IsFeatured': isFeatured === 1 ? true : false, // isFeatured in csv
        'FeaturedData': {
          'Description': isFeatured === 1 ? shortDescription : false,
          'ImageUrl': isFeatured === 1 ? imageUrl : false
        },
        'IsSelfReportEnabled': allowSelfReport === 1 ? true : false,
        'IsTeamChallenge': isTeamChallenge,
        'Name': title, // ChallengeName in csv
        'PartnerId': partnerId, // IntegrationPartnerId in csv
        'ShortDescription': sanitize(shortDescription),
        'ShowExtendedDescription': partnerId === 1 ? true : false,
        'ShowWeeklyCalendar': false, // not sure what this does, CTRT has this as false
        'StartDate': startDate,
        'TargetUrl': partnerId === 1 ? '/Home?sametab=true' : '',
        // trying to check for targeting by seeing if there are values in subgroup or field1 name
        'Targeting': subgroup || field1 ? [
          {
            'SubgroupId': subgroup ? subgroup : '0', // if no subgroup, use 0 aka none
            'Name': '', // let's hope this is optional since How would we know the Subgroup Name?
            'IsImplicit': field1 ? true : false, // not sure what this does. Seems to be true for tags and false for subgroups.
            'IsPHI': false,
            'Tags':
              field1 ? makeTags() : null
          }
        ] : [], // if no targeting, use an empty array
        'TeamSize': isTeamChallenge === 1 ? { MaxTeamSize: maxTeamSize, MinTeamSize: minTeamSize } : null
      };
      console.log('data for upload:', data);

      // upload if heartbeat survey
      if (surveyId !== '') {
        $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Uploading...');
        $.ajax({
          url: 'https://api.limeade.com/api/admin/activity',
          type: 'POST',
          dataType: 'json',
          data: JSON.stringify(data),
          headers: {
            Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
          },
          contentType: 'application/json; charset=utf-8'
        }).done((result) => {
          const surveyUrl = `/api/Redirect?url=https%3A%2F%2Fheartbeat.adurolife.com%2Fapp%2Fsurvey%2F%3Fs%3D${surveyId}%26q1%3D${result.Data.ChallengeId}%26q4%3D%5Bparticipantcode%5D%26q5%3D%5Be%5D`;
          $.ajax({
            url: 'https://api.limeade.com/api/admin/activity/' + result.Data.ChallengeId,
            type: 'PUT',
            dataType: 'json',
            data: JSON.stringify({
              'AboutChallenge': longDescription.replace(/\${surveyUrl}/g, surveyUrl) // replaces &{surveyUrl} in file's longDescription (aka MoreInformation)
            }),
            headers: {
              Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
            },
            contentType: 'application/json; charset=utf-8'
          }).done((result) => {
            // Change row to green on success (and remove red if present)
            $('#' + employerName.replace(/\s*/g, '')).removeClass('bg-danger');
            $('#' + employerName.replace(/\s*/g, '')).addClass('bg-success text-white');
            $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Success');
            $('#' + employerName.replace(/\s*/g, '') + ' .challenge-id').html(`<a href="${client.fields['Domain']}/admin/program-designer/activities/activity/${result.Data.ChallengeId}" target="_blank">${result.Data.ChallengeId}</a>`);
            // upload next challenge in table
            if (rowId < clientsFromCsv.length-1) {
              rowId++;
              massUploadChallenge(rowId);
            }

          }).fail((request, status, error) => {
            $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
            $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
            console.error(request.status);
            console.error(request.responseText);
            console.log('Update challenge failed for client', client.fields['Limeade e=']);
            // upload next challenge in table
            if (rowId < clientsFromCsv.length-1) {
              rowId++;
              massUploadChallenge(rowId);
            }

          });

        }).fail((request, status, error) => {
          $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
          $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
          console.error(request.status);
          console.error(request.responseText);
          console.log('Create challenge failed for client ' + client.fields['Limeade e=']);
          // upload next challenge in table
          if (rowId < clientsFromCsv.length-1) {
            rowId++;
            massUploadChallenge(rowId);
          }
          
        });
      } else {
        // upload when no heartbeat survey
        $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Uploading...');
        $.ajax({
          url: 'https://api.limeade.com/api/admin/activity',
          type: 'POST',
          dataType: 'json',
          data: JSON.stringify(data),
          headers: {
            Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
          },
          contentType: 'application/json; charset=utf-8'
        }).done((result) => {

          // Change row to green on success
          $('#' + employerName.replace(/\s*/g, '')).removeClass('bg-danger');
          $('#' + employerName.replace(/\s*/g, '')).addClass('bg-success text-white');
          $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Success');
          $('#' + employerName.replace(/\s*/g, '') + ' .challenge-id').html(`<a href="${client.fields['Domain']}/admin/program-designer/activities/activity/${result.Data.ChallengeId}" target="_blank">${result.Data.ChallengeId}</a>`);

          // upload next challenge in table
          if (rowId < clientsFromCsv.length-1) {
            rowId++;
            massUploadChallenge(rowId);
          }

        }).fail((xhr, request, status, error) => {
          $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
          $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
          console.error('status: ', request.status);
          console.error('request: ', request.responseText);
          console.log('Create challenge failed for client ' + client.fields['Limeade e=']);

          // upload next challenge in table
          if (rowId < clientsFromCsv.length-1) {
            rowId++;
            massUploadChallenge(rowId);
          }

        });  
      }

    } // end massUploadChallenge ?
  } // end massUpload

  function uploadChallenge(client) {
    const employerName = client.fields['Limeade e='];

    let frequency = '';
    if (enableDeviceTracking === 1) {
      frequency = 'Daily';
    } else if (isWeekly === 1) {
      frequency = 'Weekly'; // this order is intentional, since Weekly Steps have Frequency of Weekly
    } else {
      frequency = 'None';
    }

    // most of the time, Activity Type is the activityText, unless it's a weekly units non-device challenge
    let activityType = '';
    if (enableDeviceTracking === 1 && isWeekly === 1) {
      activityType = '';
    } else {
      activityType = activityText;
    }

    let amountUnit = 'times';
    switch (enableDeviceTracking) {
      case 1:
        if (isWeekly === 0) {
          amountUnit = 'steps';
        } else if (isWeekly === 1) {
          amountUnit = activityText;
        }
        break;
      case 0:
        amountUnit = 'times';
        break;
    }

    // prepping for splitting tags for upload
    let tagValues1 = [];
    let tagValues2 = [];
    let tagValues3 = [];

    // conditionally setting the tags in case there are fewer than 3 targeting columns
    let tags = [];
    function makeTags() {
      field1 ? tags.push({
        'TagName': field1 ? field1 : '',
        'TagValues':
          field1Value ? tagValues1.concat(field1Value.split('|').map(tag => tag.trim())) : '' // splitting tags on the | like Limeade, also trimming out whitespace just in case
      }) : null;
      field2 ? tags.push({
        'TagName': field2 ? field2 : '',
        'TagValues':
          field2Value ? tagValues2.concat(field2Value.split('|').map(tag => tag.trim())) : ''
      }) : null;
      field3 ? tags.push({
        'TagName': field3 ? field3 : '',
        'TagValues':
          field3Value ? tagValues3.concat(field3Value.split('|').map(tag => tag.trim())) : ''
      }) : null;
      return tags;
    }

    const data = {
      'AboutChallenge': sanitize(longDescription),
      'ActivityReward': {
        'Type': 'IncentivePoints',
        'Value': pointValue
      },
      'ActivityType': activityType, // Activity in csv, except for definition above
      'AmountUnit': amountUnit,
      'ButtonText': partnerId === 1 ? 'CLOSE' : '',
      'ChallengeLogoThumbURL': imageUrl,
      'ChallengeLogoURL': imageUrl,
      'ChallengeTarget': challengeTarget, // Target in csv
      'ChallengeType': challengeType, // ChallengeType in csv
      'Dimensions': [],
      'DefaultPrivacyFlag': defaultPrivacy === 0 ? 'Unspecified': 1,
      'DisplayInProgram': startDate === moment().format('YYYY-MM-DD') ? true : false,  // sets true if the challenge starts today
      'DisplayPriority': displayPriority,
      'EndDate': endDate,
      'EventCode': eventCode,
      'Frequency': frequency,
      'IsDeviceEnabled': enableDeviceTracking === 1 ? true : false, // EnableDeviceTracking in csv
      'IsFeatured': isFeatured === 1 ? true : false, // isFeatured in csv
      'FeaturedData': {
        'Description': isFeatured === 1 ? shortDescription : false,
        'ImageUrl': isFeatured === 1 ? imageUrl : false
      },
      'IsSelfReportEnabled': allowSelfReport === 1 ? true : false,
      'IsTeamChallenge': isTeamChallenge,
      'Name': title, // ChallengeName in csv
      'PartnerId': partnerId, // IntegrationPartnerId in csv
      'ShortDescription': sanitize(shortDescription),
      'ShowExtendedDescription': partnerId === 1 ? true : false,
      'ShowWeeklyCalendar': false, // not sure what this does, CTRT has this as false
      'StartDate': startDate,
      'TargetUrl': partnerId === 1 ? '/Home?sametab=true' : '',
      // trying to check for targeting by seeing if there are values in subgroup or field1 name
      'Targeting': subgroup || field1 ? [
        {
          'SubgroupId': subgroup ? subgroup : '0', // if no subgroup, use 0 aka none
          'Name': '', // let's hope this is optional since How would we know the Subgroup Name?
          'IsImplicit': field1 ? true : false, // not sure what this does. Seems to be true for tags and false for subgroups.
          'IsPHI': false,
          'Tags':
            field1 ? makeTags() : null
        }
      ] : [], // if no targeting, use an empty array
      'TeamSize': isTeamChallenge === 1 ? { MaxTeamSize: maxTeamSize, MinTeamSize: minTeamSize } : null
    };
    console.log('data for upload:', data);

    // upload if heartbeat survey
    if (surveyId !== '') {
      $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Uploading...');
      $.ajax({
        url: 'https://api.limeade.com/api/admin/activity',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(data),
        headers: {
          Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
        },
        contentType: 'application/json; charset=utf-8'
      }).done((result) => {
        const surveyUrl = `/api/Redirect?url=https%3A%2F%2Fheartbeat.adurolife.com%2Fapp%2Fsurvey%2F%3Fs%3D${surveyId}%26q1%3D${result.Data.ChallengeId}%26q4%3D%5Bparticipantcode%5D%26q5%3D%5Be%5D`;
        $.ajax({
          url: 'https://api.limeade.com/api/admin/activity/' + result.Data.ChallengeId,
          type: 'PUT',
          dataType: 'json',
          data: JSON.stringify({
            'AboutChallenge': longDescription.replace(/\${surveyUrl}/g, surveyUrl) // replaces &{surveyUrl} in file's longDescription (aka MoreInformation)
          }),
          headers: {
            Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
          },
          contentType: 'application/json; charset=utf-8'
        }).done((result) => {
          // Change row to green on success (and remove red if present)
          $('#' + employerName.replace(/\s*/g, '')).removeClass('bg-danger');
          $('#' + employerName.replace(/\s*/g, '')).addClass('bg-success text-white');
          $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Success');
          $('#' + employerName.replace(/\s*/g, '') + ' .challenge-id').html(`<a href="${client.fields['Domain']}/admin/program-designer/activities/activity/${result.Data.ChallengeId}" target="_blank">${result.Data.ChallengeId}</a>`);

        }).fail((request, status, error) => {
          $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
          $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
          console.error(request.status);
          console.error(request.responseText);
          console.log('Update challenge failed for client', client.fields['Limeade e=']);
        });

      }).fail((request, status, error) => {
        $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
        $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
        console.error(request.status);
        console.error(request.responseText);
        console.log('Create challenge failed for client ' + client.fields['Limeade e=']);
      });
    } else {
      // upload when no heartbeat survey
      $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Uploading...');
      $.ajax({
        url: 'https://api.limeade.com/api/admin/activity',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(data),
        headers: {
          Authorization: 'Bearer ' + client.fields['LimeadeAccessToken']
        },
        contentType: 'application/json; charset=utf-8'
      }).done((result) => {

        // Change row to green on success
        $('#' + employerName.replace(/\s*/g, '')).removeClass('bg-danger');
        $('#' + employerName.replace(/\s*/g, '')).addClass('bg-success text-white');
        $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Success');
        $('#' + employerName.replace(/\s*/g, '') + ' .challenge-id').html(`<a href="${client.fields['Domain']}/admin/program-designer/activities/activity/${result.Data.ChallengeId}" target="_blank">${result.Data.ChallengeId}</a>`);


      }).fail((xhr, request, status, error) => {
        $('#' + employerName.replace(/\s*/g, '')).addClass('bg-danger text-white');
        $('#' + employerName.replace(/\s*/g, '') + ' .status').html('Failed: ' + request.responseText);
        console.error('status: ', request.status);
        console.error('request: ', request.responseText);
        console.log('Create challenge failed for client ' + client.fields['Limeade e=']);
      });  
    }

  }


  return (
    <div id="app">
      <Header />

      <div className="row mb-1">
        <div className="col text-left">
          <h4>Clients</h4>
          {/* For single-client-select */}
          {/* <label htmlFor="employerName">EmployerName</label>
          <select id="employerName" className="form-control custom-select" onChange={selectClient}>
            <option defaultValue>Select Employer</option>
            {renderEmployerNames()}
          </select> */}
          <div className="form-group">
            <label htmlFor="csvClientsInput">Import from CSV</label>
            <input type="file" id="csvClientsInput" className="form-control-file" accept="*.csv" onChange={(e) => handleClientsCsvFiles(e)} />
            <small className="form-text text-muted text-left">Note: file matches on Salesforce Name in Clients Most up to Date. Column in .csv is Account.</small>
          </div>
        </div>

        <div className="col text-left">
          <h4>Challenge Content</h4>
          <div className="form-group">
            <label htmlFor="csvChallengesInput">Import from CSV</label>
            <input type="file" id="csvChallengesInput" className="form-control-file" accept="*.csv" onChange={(e) => handleChallengesCsvFiles(e)} />
          </div>
          <div className="form-group">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="toggleHeartbeatSurvey" onChange={handleHeartbeatSurvey} />
              <label className="form-check-label" htmlFor="toggleHeartbeatSurvey">Heartbeat Survey?</label>
            </div>
            <div id="heartbeatSurvey">
              <label htmlFor="surveyId">Heartbeat Survey ID</label>
              <input className="form-control form-control-sm" type="text" id="surveyId" value={surveyId} onChange={handleSurveyId} />
              <small>Note: App will replace {helpMessage} in Long Description HTML with the completed Heartbeat survey URL during upload.</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-1">
        <div className="col text-right">
          <button type="button" id="massUploadButton" className="btn btn-primary" onClick={(e) => massUpload(e)}>Mass Upload</button>
        </div>
      </div>

      <div className="row mb-1">
        <table className="table table-hover table-striped" id="activities">
          <thead>
            <tr>
              <th scope="col">Salesforce Name</th>
              <th scope="col">Challenge Id</th>
              <th scope="col">Status</th>
              <th scope="col">Upload</th>
            </tr>
          </thead>
          <tbody>
            {clientsFromCsv ? renderClients() : <tr />}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col text-left">
          {/* TODO: add challenge form inputs here */}
        </div>
      </div>

      <Footer />

      <Modal />

    </div>
  );
}

export default App;
