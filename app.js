const express = require("express");
const axios = require("axios");
const app = express();
const port = 3001;

const config = {
  headers: {
    "X-Riot-Token": "RGAPI-77b6bd67-535f-4962-8cde-cd774706f522",
    "Content-Type": "application/json",
  },
};

const getSummonerPuuid = async (summonerName) => {
  const response = await axios.get(
    `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`,
    config
  );
  return response.data.puuid;
};

const getIdsRecentMatches = async (puuid) => {
  const response = await axios.get(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
    config
  );
  return response.data;
};

const getMatchById = async (matchId, puuid) => {
  const playerMatchData = await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      config
    )
    .then((response) => {
      const participantData = response.data.info.participants.find(
        (participant) => participant.puuid === puuid
      );

      let gameDuration = Math.round(response.data.info.gameDuration / 60);
      let gameEndTimestamp = response.data.info.gameEndTimestamp;
      let creepScore = participantData.totalMinionsKilled + participantData.neutralMinionsKilled;
      let creepRatio = Math.round(creepScore / gameDuration);

      let matchData = {
        gameDuration,
        gameEndTimestamp,
        creepScore,
        creepRatio,
        win: participantData.win,
        summonerName: participantData.summonerName,
        championName: participantData.championName,
        kills: participantData.kills,
        deaths: participantData.deaths,
        assists: participantData.assists,
        champLevel: participantData.champLevel,
        perks: participantData.perks,
        spell1Casts: participantData.spell1Casts,
        spell2Casts: participantData.spell2Casts,
        spell3Casts: participantData.spell3Casts,
        spell4Casts: participantData.spell4Casts,
      };
      return matchData;
    });
  return playerMatchData;
};

const getRecentMatchesData = async (idMatches, puuid) => {
  const data = await Promise.all(
    idMatches.map(async (id) => {
      const match = await getMatchById(id, puuid);
      return match;
    })
  );
  return data;
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/:summoner", (req, res) => {
  getSummonerPuuid(req.params.summoner).then((puuid) =>
    getIdsRecentMatches(puuid)
      .then((matches) => getRecentMatchesData(matches, puuid))
      .then((matchData) => res.send(matchData))
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
