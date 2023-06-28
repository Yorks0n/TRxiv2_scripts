const axios = require('axios');
const json2csv = require('json2csv').parse;
const fs = require('fs');

// 生成一组url，以供之后获取内容
function getAltUrls(timeframe = ['1w'], pageLen = 1){
    let urls = [];
    let pageList = Array.from({length: pageLen}, (_, index) => index + 1);
    timeframe.forEach(tf => {
        pageList.forEach(page => {
            //console.log("https://api.altmetric.com/v1/citations/" + tf + "?num_results=100&page=" + page + "&doi_prefix=10.1101");
            urls.push("https://api.altmetric.com/v1/citations/" + tf + "?num_results=100&page=" + page + "&doi_prefix=10.1101");
        }
    )});
    return urls;
}

// 从Altmetric获取指定url的结果
function getAltData(timeframe = ['1w'], pageLen = 1) {
    var urls = getAltUrls(timeframe, pageLen);
    var result = [];
    var promises = [];
    var delay = 0;
    for (let i = 0; i < urls.length; i++) {
        var promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            axios.get(urls[i])
              .then(response => {
                result.push(...response.data.results);
                resolve();
              })
              .catch(error => reject(error))
          }, delay);
          delay += 500; // 设置1秒的时间间隔
        });
        promises.push(promise);
      }
      return Promise.all(promises).then(() => result);
}

// 写个函数，专门用于Altdata的预处理
function filterAltData(altData){
    // then limit the date to be in one month
    // 计算一个月前的日期
    var oneMonthsAgo = new Date();
    oneMonthsAgo.setMonth(oneMonthsAgo.getMonth() - 1);
    // filter altData by date, in one months
    const filteredAltData = altData.filter((item) => {
        var date = new Date(item.published_on*1000); // 假设JSON数据中的日期保存在date字段中
        return !(date < oneMonthsAgo); // 过滤掉一个月前的数据，如果字段为空则也先保留
    });
    console.log("Reserve " + filteredAltData.length + " Altmetric data published in the past one month or without date.");

    // Rename history.1w, 1m of filteredAltData to X1w, X1m
    // Only reserve title, doi, altmetric_jid, score and X1w, X1m
    const renamedData = filteredAltData.map((item) => {
        const { history, ...rest } = item;
        return {
            ...rest,
            X1w: history['1w'],
            X1m: history['1m'],
        }
    } ).map(({ title, doi, altmetric_jid, score, X1w, X1m }) => ({ title, doi, altmetric_jid, score, X1w, X1m }));
    
    // replace altmetric_jid = 532721422a83ee84788b4567 with biorxiv, then only keep altmetric_jid = biorxiv or medrxiv
    const filteredData = renamedData.filter((item) => {
        if (item.altmetric_jid == '532721422a83ee84788b4567') {
            item.altmetric_jid = 'biorxiv';
        }
        return item.altmetric_jid == 'biorxiv' || item.altmetric_jid == 'medrxiv';
    });
    return filteredData;
}

//Use filteredData as input, use bioRxiv API to retrive detailed info according to altmetric_jid and doi
//Then merge the info to filteredData
function getBioRxivData(filteredData) {
    var urls = [];
    filteredData.forEach(item => {
        urls.push("https://api.biorxiv.org/details/" + item.altmetric_jid + "/" + item.doi);

    });
    var result = [];
    var promises = [];
    var delay = 0;
    for (let i = 0; i < urls.length; i++) { 
        //console.log("Fetching " + urls[i]);
        var promise = new Promise((resolve, reject) => {
            setTimeout(() => {
              axios.get(urls[i])
                .then(response => {
                  result.push(...response.data.collection);
                  resolve();
                })
                .catch(error => reject(error))
                .finally(() => {
                    printProgressBar(i/urls.length, "Fetching bioRxiv data"); // 更新进度条
                  });
            }, delay);
            delay += 1000; // 设置1秒的时间间隔
          });
          promises.push(promise);
    }

    return Promise.all(promises).then(() => result);
}

// 搞个进度条出来
function printProgressBar(percent, name) {
    const maxBarLength = 50; // 进度条的最大长度
    const barLength = Math.round(percent * maxBarLength); // 计算进度条的长度
  
    const bar = '■'.repeat(barLength).padEnd(maxBarLength, '□'); // 构造带进度的进度条
    const percentage = Math.round(percent * 100); // 计算百分比
  
    console.clear(); // 清空控制台
    console.log(name +' : ' + `[${bar}] ${percentage}%`); // 输出进度条
  }

async function main() {
    // 这里作为调试，先获取少一点的数据，暂时只取1w，1页
    const altData = await getAltData(timeframe = ['1w'], pageLen = 1);
    //console.log(altData);
    console.log("In 1w window found " + altData.length + " Altmetric data.");

    //预先处理一下，保留一个月内+无日期的数据，保留部分关键字，同时修改biorxiv的服务器名称
    const filteredAltData = filterAltData(altData);
    //console.log(filteredAltData);

    // 利用API请求bioRxiv数据
    const bioData = await getBioRxivData(filteredAltData);
    //其中每个doi只保留version值最大的那个结果
    const map = new Map();
    bioData.forEach(item => {
            if(!map.has(item.doi) || map.get(item.doi).version < item.version){
              map.set(item.doi, item);
            }
        });
    const biorxivDedup = Array.from(map.values());
    
    //merge filteredAltData and biorxivDedup by doi
    const mergedData = filteredAltData.reduce((acc, obj1) => {
        const obj2 = biorxivDedup.find((obj2) => obj2.doi === obj1.doi);
        if (obj2) {
            acc.push(Object.assign({}, obj1, obj2, {upupdate_time : Date.now()} ));
        }
        return acc;
    }, []);

    // 计算一个月前的日期
    var oneMonthsAgo = new Date();
    oneMonthsAgo.setMonth(oneMonthsAgo.getMonth() - 1);

    // filter mergedData by date, in three months
    const filteredMergedData = mergedData.filter((item) => {
        var date = new Date(item.date); // 假设JSON数据中的日期保存在date字段中
        return date >= oneMonthsAgo;
    });

    // sort all the papers by score, and find up to 10 papers of each category
    const sortedMergedData = filteredMergedData.sort((a, b) => b.score - a.score);
    // 对每个 category 取最多 10 个分数最高的结果
    const top10Data = {};
    const top10MergedData = [];
    sortedMergedData.forEach(obj => {
      const { category } = obj;
      if (!top10Data.hasOwnProperty(category)) {
        top10Data[category] = [];
      }

      if (top10Data[category].length < 10) {
        top10Data[category].push(obj);
        top10MergedData.push(obj);
      }
    });
    

    // output mergedData in csv format
    /*
    const csvData = json2csv(filteredMergedData);
    fs.writeFile('data.csv', csvData, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('CSV file has been written');
        }
      });
    //console.log(mergedData[0]);
    */

    // output mergedData in json format
    fs.writeFile('hugo_site/data/data.json', JSON.stringify(top10MergedData), (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('JSON file has been written');
        }
      });

}

main();