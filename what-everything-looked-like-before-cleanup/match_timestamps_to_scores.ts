const fs = require('node:fs');

const resultsString = fs.readFileSync('lil_muscles_results');
const resultsArray = JSON.parse(resultsString);
//console.log(resultsArray);
//console.log(resultsArray[3]);

// we add fields for raw result values and for which hour each game belongs to
resultsArray.forEach((player, index) => {
    if (0 === index) return;

    player.rawResults = '';
    player.hours = '';
});
// console.log(resultsArray);

// we then need to create a mapping between a player's handle
// and their index in the above array,
// so we can easily find them in the array when we are ready to add
// the game hour and timestamp data
const playerNameToIndex = new Map();
resultsArray.forEach((player, index) => {
    // there is no rank 0 player heh
    if (index === 0) return;

    const { name } = player;
    playerNameToIndex.set(name, index);
});
//console.log(playerNameToIndex);

const pgnJsonString = fs.readFileSync('lil_muscles_pgn_as_json_using_pgn_to_json_light.json');
// console.log(pgnJsonString);
let pgnJson = [];
try {
    pgnJson = JSON.parse(pgnJsonString);
    console.log(`typeof pgnJson: ${typeof(pgnJson)}`);
   // console.log(pgnJson);
} catch (e){
    console.log()
    console.log(e);
}

const pgnJsonTrimmed = [];
pgnJson.forEach(game => {
    const gameDetails = game.headers;

    // we extract the parts we need to double-check this data
    // against the Lichess-arena-scoring-converted scores,
    // and to match up those scores to their timestamps
    const { White, Black, Result, UTCTime } = gameDetails;

    // we figure out which hour that game took place in
    // based on the HH value of the HH:MM:ss UTCTime field
    let hour = null;
    if (UTCTime.startsWith('19')) {
        hour = '1';
    } else if (UTCTime.startsWith('20')) {
        hour = '2';
    } else if (UTCTime.startsWith('21')) {
        hour = '3';
    } else if (UTCTime.startsWith('22')) {
        hour = '4';
    }

    // we also parse the result string,
    // because we need the separate 0 - 1/2 - 1 values for each player
    // note that we multiply all values by two so we can use integers everywhere,
    // making it easier to compare this tally against the Lichess-adjusted-scores string
    let whiteResult = 'X';
    let blackResult = 'X';
    if ('0-1' === Result){
        whiteResult = '0';
        blackResult = '2';
    } else if ('1/2-1/2' === Result){
        whiteResult = '1';
        blackResult = '1';
    } else if ('1-0' === Result){
        whiteResult = '2';
        blackResult = '0';
    }

    // We leave Result and UTCTime in just to confirm
    // that the processing above worked as expected,
    // and to have some fallback data in case UTCTime and/or Result
    // had some value(s) outside their expected ranges
    const gameTrimmed = {
        White,
        Black,
        Result,
        whiteResult,
        blackResult,
        UTCTime,
        hour
    };
    pgnJsonTrimmed.push(gameTrimmed);
});

// console.log(pgnJsonTrimmed);


// Now, for each game in pgnJsonTrimmed,
// we add the results to result strings for both the black and white players
// and we add the hours as well
pgnJsonTrimmed.forEach((game) => {
    const { White, Black, whiteResult, blackResult, hour } = game;
    
    const whiteIndex = playerNameToIndex.get(White);
    const blackIndex = playerNameToIndex.get(Black);

    // There is one player - nacvalovaschess - who has been removed from the results table altogether,
    // but they still appear in the results, and games against them still appear for their opponents
    // therefore, we still add those games for their opponents, and ignore the fact
    // that they are not in the playerNameToIndex set
    // Note: this player has been kicked from the team, as there's now a ToS violation on their profile
    if (whiteIndex !== undefined){
        resultsArray[whiteIndex].rawResults += whiteResult;
        resultsArray[whiteIndex].hours += hour;
    }

    if (blackIndex !== undefined){
        resultsArray[blackIndex].rawResults += blackResult;
        resultsArray[blackIndex].hours += hour;
    }
});

// console.log(resultsArray);

// We then compare the scores and rawResults and hours lengths to make sure everything matches up
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    player.scoresLength = player.scores.length;
    player.rawResultsLength = player.rawResults.length;
    player.hoursLength = player.hours.length;
    player.hasMismatch = !(
        player.scoresLength === player.rawResultsLength
        && player.scoresLength === player.hoursLength
    );
});

//console.log(resultsArray);

const playersWithMismatches = [];
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    if (player.hasMismatch){
        playersWithMismatches.push(player);
    }
});

// This spits out 0 and an empty array - good news
// It means that for every game for every player, each Lichess score should match up with an hour value
console.log(`count of players with mismatches between number of Lichess scores and number of raw scores or number of hours entries: ${playersWithMismatches.length}`);
console.log(playersWithMismatches);

// Now, we calculate the hour-by-hour totals for every player
// The moment of truth!
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    let hour1Scores = '';
    let hour2Scores = '';
    let hour3Scores = '';
    let hour4Scores = '';

    for (let i = 0; i < player.scoresLength; i++){
        if (player.hours[i] === '1'){
            hour1Scores += player.scores[i];
        } else if (player.hours[i] === '2'){
            hour2Scores += player.scores[i];
        } else if (player.hours[i] === '3'){
            hour3Scores += player.scores[i];
        } else if (player.hours[i] === '4'){
            hour4Scores += player.scores[i];
        }
    }

    let hour1Total = 0;
    let hour2Total = 0;
    let hour3Total = 0;
    let hour4Total = 0;

    for (let i = 0; i < hour1Scores.length; i++){
        hour1Total += parseInt(hour1Scores[i], 10);
    }
    for (let i = 0; i < hour2Scores.length; i++){
        hour2Total += parseInt(hour2Scores[i], 10);
    }
    for (let i = 0; i < hour3Scores.length; i++){
        hour3Total += parseInt(hour3Scores[i], 10);
    }
    for (let i = 0; i < hour4Scores.length; i++){
        hour4Total += parseInt(hour4Scores[i], 10);
    }

    player.scoresByHour = {
        hour1Scores,
        hour1Total,
        hour2Scores,
        hour2Total,
        hour3Scores,
        hour3Total,
        hour4Scores,
        hour4Total,
    };
});

console.log(resultsArray);


const hour1Winners = [];
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    const { name, scoresByHour } = player;
    const { hour1Scores, hour1Total } = scoresByHour;
    // we reversed the score string to match the way it's shown in the Lichess GUI
    const reversedScores = hour1Scores.split("").reverse().join("");
    const hour1Stuff = { 
        name,
        reversedScores,
        hour1Total
    };
    hour1Winners.push(hour1Stuff);
});

hour1Winners.sort((a, b) => b.hour1Total - a.hour1Total);
console.log('HOUR 1 TOP 6');
console.log(hour1Winners.slice(0, 6));


const hour2Winners = [];
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    const { name, scoresByHour } = player;
    const { hour2Scores, hour2Total } = scoresByHour;
    // we reversed the score string to match the way it's shown in the Lichess GUI
    const reversedScores = hour2Scores.split("").reverse().join("");
    const hour2Stuff = { 
        name,
        reversedScores,
        hour2Total
    };
    hour2Winners.push(hour2Stuff);
});
hour2Winners.sort((a, b) => b.hour2Total - a.hour2Total);
console.log('HOUR 2 TOP 6');
console.log(hour2Winners.slice(0, 6));


const hour3Winners = [];
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    const { name, scoresByHour } = player;
    const { hour3Scores, hour3Total } = scoresByHour;
    // we reversed the score string to match the way it's shown in the Lichess GUI
    const reversedScores = hour3Scores.split("").reverse().join("");
    const hour3Stuff = { 
        name,
        reversedScores,
        hour3Total
    };
    hour3Winners.push(hour3Stuff);
});
hour3Winners.sort((a, b) => b.hour3Total - a.hour3Total);
console.log('HOUR 3 TOP 6');
console.log(hour3Winners.slice(0, 6));


const hour4Winners = [];
resultsArray.forEach((player, index) => {
    if (index === 0) return;

    const { name, scoresByHour } = player;
    const { hour4Scores, hour4Total } = scoresByHour;
    // we reversed the score string to match the way it's shown in the Lichess GUI
    const reversedScores = hour4Scores.split("").reverse().join("");
    const hour4Stuff = { 
        name,
        reversedScores,
        hour4Total
    };
    hour4Winners.push(hour4Stuff);
});
hour4Winners.sort((a, b) => b.hour4Total - a.hour4Total);
console.log('HOUR 4 TOP 6');
console.log(hour4Winners.slice(0, 6));


///// RESULTS
/*
HOUR 1 TOP 5
1st & $25   yoseph2013           - 108 points    - '030303344554440325454023444444420022022' scores
2nd & $10   greennight           - 98 points     - '0335540335420213003032540224444522202302' scores
3rd & $5    AlexTriapishko       - 84 points     - '224422240224444222440220220224444' scores
4th & $5    Ragehunter           - 64 points     - '0224032444032440200220031022444' scores
5th & $5    Pap-G                - 64 points     - '23555444444444422' points

HOUR 2 TOP 5
1. strongbulletplayer1  - 106 points    - '2244444442224444402244442202222244402' scores
2. yoseph2013           - 95 points     - '4552022542225544540324032422344' scores
3. zhuzhu415            - 88 points     - '03000335454554544540220220230220224' scores
4. mohamadghanbar86     - 86 points     - '312033500324544403223240202244032440' scores
5. AlexTriapishko       - 83 points     - '444444222444022444020224401211222' scores

HOUR 3 TOP 5
1. Serg_01              - 116 points    - '3255454233445440330335033444444444' scores
2. Tim-Grutter          - 99 points     - '003355442220225440212244540220224444022' scores
3. greennight           - 97 points     - '33220202132422133223022554540200224402345' scores
4. cesart22             - 97 points     - '303350235403013355450334440203033452' scores
5. HardDrive54          - 93 points     - '50235454200130103344444440030324440220' scores

HOUR 4 TOP 5
1. toivok3              - 139 points    - '32550335555554550335555540325454500002342' scores
2. Artem_0degov         - 125 points    - '2303245544445444554444444022022444020224' scores
3. Fortend              - 120 points    - '31335554523345455554503355503345' scores
4. Zu_Cho_Chi           - 117 points    - '354444444440224002244444444444402244010' scores
5. BALLSychess          - 101 points    - '313254544444444444444022222444' scores









*/