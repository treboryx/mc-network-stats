import cheerio from 'cheerio';
import fetch from 'node-fetch'; // Main http module
export function blocksmc(query: string, type: string) {
  switch (type) {
    case 'leaderboard':
      return new Promise((resolve, _reject) => {
        const leaderboards = [
          'sky-wars',
          'sky-wars-solo',
          'bed-wars',
          'bed-wars-solo',
          'egg-wars',
          'egg-wars-solo',
          'top-skypvp-s1',
          'survival-games',
          '1vs1',
          'the-bridge',
          'lucky-block-wars',
          'sky-giant',
          'sky-giant-mini',
          'murder-mystery',
          'tnt-tag',
          'block-party',
          'gravity',
          'super-jump',
          'splegg',
          'quake-craft',
          'uhc-run',
        ];
        if (!leaderboards.includes(query))
          return resolve({ errors: 'Invalid game leaderboard.' });
        fetch(`https://blocksmc.com/${query}`)
          .then((res) => res.text())
          .then((body: string) => {
            type Obj = {
              readonly [key: string]: number | string;
            };
            const data: readonly Obj[] = [];
            const template: readonly (string | number)[] = [];
            const $ = cheerio.load(body);
            $('thead')
              .find('td')
              .each(function (this: string) {
                const stat = $(this)
                  .text()
                  .trim()
                  .replace(/\s\s|^Av$/g, '')
                  .toLowerCase()
                  .replace('#', 'rank')
                  .replace('w/l', 'winLossRatio')
                  .replace('k/d', 'killDeathRatio');
                if (stat.length > 0) template.push(stat);
              });
            $('tbody')
              .find('tr')
              .each(function (this: string) {
                const stat = $(this)
                  .text()
                  .trim()
                  .replace(/\s\s/g, '')
                  .split(' ');
                const obj: Obj = {};
                for (let i = 0; i < template.length; i++) {
                  obj[String(template[i])] = !isNaN(Number(stat[i]))
                    ? Number(stat[i])
                    : stat[i];
                }
                data.push(obj);
              });
            return resolve(data);
          })
          .catch((e) => {
            resolve({
              errors: "Can't fetch stats, Website is probably offline.",
            });
            console.log(e);
          });
      });

    case 'player':
      return new Promise((resolve, _reject) => {
        fetch(`https://blocksmc.com/player/${query}`)
          .then((res) => res.text())
          .then((body) => {
            type Data1 = {
              readonly [key: string]: object;
            };
            type Data = {
              readonly games: Data1;
            };
            const data: Data = { games: {} };
            const $ = cheerio.load(body);
            const name = $('.profile-header h1').text().trim();
            const rank = $('.profile-rank').text().replace('\n', '').trim();
            const timePlayed = $('h1[dir=ltr]').text().replace('\n', '').trim();
            let totalKills = 0;
            let totalWins = 0;
            let totalGames = 0;
            let totalPoints = 0;
            let totalDeaths = 0;
            $('div.col-xl-4').each(function (this: string) {
              const stats = {};
              $(this)
                .find('li')
                .each(function (this: string) {
                  switch ($(this).find('div.key').text()) {
                    case 'Kills':
                      totalKills += Number($(this).find('div.val').text());
                      break;
                    case 'Wins':
                      totalWins += Number($(this).find('div.val').text());
                      break;
                    case 'Played':
                      totalGames += Number($(this).find('div.val').text());
                      break;
                    case 'Points':
                      totalPoints += Number($(this).find('div.val').text());
                      break;
                    case 'Deaths':
                      totalDeaths += Number($(this).find('div.val').text());
                      break;
                  }

                  Object.assign(stats, {
                    [$(this).find('div.key').text()]: Number(
                      $(this).find('div.val').text()
                    ),
                  });
                });
              data.games[
                $(this)
                  .find('div.title')
                  .text()
                  .trim()
                  .replace(/ |:/g, '_')
                  .replace('1VS1', 'Duels')
              ] = stats;
            });
            Object.assign(data, {
              name,
              rank,
              timePlayed,
              totalKills,
              totalWins,
              totalGames,
              totalPoints,
              totalDeaths,
            });

            if (!name) return resolve({ errors: 'User not found' });
            resolve(data);
          })
          .catch((e) => {
            resolve({
              errors: "Can't fetch stats, Website is probably offline.",
            });
            console.log(e);
          });
      });
  }
}
