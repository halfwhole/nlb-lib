let TIMEOUT = 2000;

const cheerio = require('cheerio');
const axios = require('axios').create({ timeout: TIMEOUT });

/* NOTE: only export getAvailabilityInfo and getTitleDetails.
 * They shall both return promises for the data in JSON format.
 */

/**
 * bid: integer
 * returns: availability info for a given bid in JSON
 * => [ { branchName: ..., shelfLocation: ..., callNumber: ..., statusDesc: ... }, ... ]
 */
async function getAvailabilityInfo(bid) {
    function parseAvailabilities(response) {
        function parseTr(tr) {
            const tds = $(tr).find('td').get();
            // objects: [ [{ branchName: ... }, { shelfLocation: ... }, { callNumber: ... }, { statusDesc: ... }], ... ]
            const objects = tds.map(td => parseTd(td));
            //  availabilities: [ { branchName: ..., shelfLocation: ..., callNumber: ..., statusDesc: ... }, ... ]
            const availabilities = objects.reduce((acc, object) => ({ ...acc, ...object }), {});
            return availabilities;
        }
        function parseTd(td) {
            switch($(td).attr('data-caption')) {
                case 'Library':
                    return { branchName: $(td).find('a').find('span').text() };
                case 'Section/Shelf Location':
                    return { shelfLocation: $(td).find('book-location').text() };
                case 'Call Number':
                    return { callNumber: $(td).find('span').map(function() { return $(this).text(); }).get().join(' ') };
                case 'Item Status':
                    return { statusDesc: $(td).find('span').text() };
            }
        }
        const $ = cheerio.load(response.data);
        const trs = $('tbody').find('tr').get();
        const availabilities = trs.map(tr => parseTr(tr));
        return availabilities;
    }

    const magic_number = await getMagicNumber();
    const CATALOGUE_AVAILABILITIES_URL = `https://catalogue.nlb.gov.sg/cgi-bin/spydus.exe/XHLD/WPAC/BIBENQ/${magic_number}/${bid}?RECDISP=REC`;
    const response = await axios.get(CATALOGUE_AVAILABILITIES_URL);
    const availabilities = parseAvailabilities(response);
    if (availabilities.length === 0) {
        throw 'Availabilities could not be found, perhaps the book id is incorrect?';
    }
    return availabilities;
}

/**
 * bid: integer
 * returns: title details for a given bid in JSON
 * => { titleName: ..., author: ... }
 */
async function getTitleDetails(bid) {
    function parseTitleDetails(response) {
        const $ = cheerio.load(response.data);
        const title = $('.card-title').find('a').text();
        const author = $('.recdetails').find('span').first().text();
        return { titleName: title, author: author }
    }

    const magic_number = await getMagicNumber();
    const CATALOGUE_TITLE_DETAILS_URL = `https://catalogue.nlb.gov.sg/cgi-bin/spydus.exe/XFULL/WPAC/BIBENQ/${magic_number}/${bid}?FMT=REC`;
    const response = await axios.get(CATALOGUE_TITLE_DETAILS_URL);
    const titleDetails = parseTitleDetails(response);
    if (titleDetails['titleName'] === '' || titleDetails['author'] === '') {
        throw 'Title details could not be found, perhaps the book id is incorrect?';
    }
    return titleDetails;
}

/**
 * returns: integer
 */
async function getMagicNumber() {
    const CATALOGUE_URL = 'https://catalogue.nlb.gov.sg/cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ';
    try {
        const response = await axios.get(CATALOGUE_URL);
        const $ = cheerio.load(response.data);
        // data_returnurl: e.g. http://catalogue.nlb.gov.sg/cgi-bin/spydus.exe/PGM/WPAC/CCOPT/LB/8?RDT=/cgi-bin/spydus.exe/SET/WPAC/BIBENQ/45640926
        const data_returnurl = $('nlb-mylibrary').attr('data-returnurl').trim();
        const magic_number = data_returnurl.split('/').pop();
        return magic_number;
    } catch (error) {
        throw "Error in getMagicNumber: " + error;
    }
}
