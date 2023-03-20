const https = require('node:https');
const fs = require('node:fs');

// the api call to get info for a specific page of lichess arena tournament results is
// https://lichess.org/api/tournament/{tournament id}?page=[1...200]
// Lichess API docs: https://lichess.org/api#tag/Arena-tournaments
// grab the tournament id from the tournament page, for example: https://lichess.org/tournament/DRlipBnK, id is the last bit
// let readyForNext = true;
const baseRequestString = 'https://lichess.org/api/tournament/DRlipBnK?page=';
// let page = 1;

// //while (page < 4) {
// 	//console.log('in while loop, before the if');
// 	if (readyForNext) {
// 		readyForNext = false;
// 		//https.get(`${baseRequestString}${page.toString()}`, (res) => {
// 		https.get("https://lichess.org/api/tournament/DRlipBnK?page=1", (res) => {
// 			console.log('headers:', res.headers);

// 			res.on('data', (d) => {
// 				const jsonRes = JSON.parse(d);
// 				const standing = jsonRes.standing;
// 				console.log(`Results page: ${standing.page}`);
// 				standing.players.forEach(player => {
// 					const {name, score, sheet} = player;
// 					const {scores} = sheet;
// 					console.log('--------');
// 					console.log(`${name} | ${score}`);
// 					console.log(scores);
// 				});
// 				page++;
// 				readyForNext = true;
// 			})
// 		}).on('error', (e) => {
// 			console.error(e);
// 		});
// 	}
// //}

const parsedPlayers = Array();

for (let page = 1; page < 57; page++){
	setTimeout(getResultsPage, page * 1000, page);
}

function getResultsPage(page){
	https.get(`${baseRequestString}${page.toString()}`, (res) => {
		res.on('data', (d) => {
			const jsonRes = JSON.parse(d);
			const standing = jsonRes.standing;
			console.log(`Results page: ${standing.page}`);
			standing.players.forEach(player => {
				const {name, score, sheet} = player;
				const {scores} = sheet;
				// console.log('--------');
				// console.log(`${name} | ${score}`);
				// console.log(scores);
				const parsedPlayer = {
					name, score, scores
				};
				parsedPlayers[player.rank] = parsedPlayer;
			});
		})
	}).on('error', (e) => {
		console.error(e);
	});
}

setTimeout(logParsedPlayers, 100000);

function logParsedPlayers(){
	console.log(parsedPlayers);
	const parsedPlayersString = JSON.stringify(parsedPlayers);
	fs.writeFileSync('lil_muscles_results', parsedPlayersString);
}



// https.get('https://lichess.org/api/tournament/DRlipBnK?page=1', (res) => {
//   console.log('statusCode:', res.statusCode);
//   console.log('headers:', res.headers);

//   // the response is a JSON string, so we construct a JSON object from it
//   res.on('data', (d) => {
// 	const jsonRes = JSON.parse(d);
// 	const standing = jsonRes.standing;
// 	console.log(`Results page: ${standing.page}`);
// 	console.log(`is standing.players an array?: ${Array.isArray(standing.players)}`);
// 	standing.players.forEach(playerDetails => {
// 		const {name, score, sheet} = playerDetails;
// 		console.log("--------------");
// 		console.log(`${name} | ${score}`);
// 		console.log(sheet.scores);
// 	});
// 	// process.stdout.write(d);
//   });

// }).on('error', (e) => {
//   console.error(e);
// });