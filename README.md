# eight-wolves
Summon challenges to disperse all over

### Purpose ###
This application can upload a single challenge to multiple platforms. Additionally, the application can create challenges with Heartbeat survey links.

This is most relevant with Flourishing challenges that need to be deployed to lots of platforms, but have the same content across all of them.

### How to Use ###
#### Clients file (CSV) ####
Ideally, you should have received a list of clients. The client names in this file need to be the Salesforce Account names. In the file itself, this column needs to be called `Account`.

Example clients file structure:
```
	Account
	Tables and More
	Butterflies R Us
	Joe's Big CD Shack
```

Once the clients file is ready, it can be loaded into the application and the application's table should populate. If a client is not appearing in the table, check the client's `Salesforce Name` in Clients Most Up to Date to ensure it matches Salesforce and the file you'll be importing into Eight Wolves. Additionally, the console log can be checked to see if the number of clients in the file matches the number of clients populated in the table.

#### Challenge Content file (CSV) ####
The Challenge Content file should be a Transporter structured file. This can be downloaded from Challenges (Classic) or Calendar Builder.

If the challenge includes a Heartbeat survey, replace the link's `href=""` with `href="${surveyUrl}"`. Eight Wolves will update this link with the properly formed link, including challenge ID, during the upload process.

Once you have this file of a single challenge ready, import the Clients file into Eight Wolves, then import the Challenge Content file. If the challenge includes a Heartbeat Survey, click the "Heartbeat Survey?" checkbox and enter the survey ID into the textbox that appears.

#### Uploading Challenges ####
Once you have both files imported and the table is populated, click the Upload button for each client and the application will upload the challenge to that client platform.

If there is an error uploading the challenge, the table row will turn red and display the error message from the API. (Note: sometimes the error message received from the API is not helpful. Sorry.)

### Getting Started Developing ###

Clone this repo, install dependencies, then start developing with webpack/browser-sync using these steps:


```
	> git clone https://github.com/arapawa/eight-wolves.git
	> cd eight-wolves
	> npm install
	> npm start
```
