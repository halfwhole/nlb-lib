# nlb-lib

This library queries book information from NLB.

## Installation

`npm install --save nlb-lib`

## Usage

Two operations are supported, `getTitleDetails` and `getAvailabilityInfo`.

`getTitleDetails(bid)`: given a book id, return its title details in this format:

``` javascript
{ titleName: ..., author: ... }

// Example
{ titleName: 'The annotated Alice : Alice\'s adventures in Wonderland & Through the looking-glass',
  author: 'Carroll, Lewis, 1832-1898' }
```

`getAvailabilityInfo(bid)`: given a book id, return its availabilities in this format:

``` javascript
[ { branchName: ..., shelfLocation: ..., callNumber: ..., statusDesc: ... }, ... ]

// Example
[ { branchName: 'Central Public Library',
    shelfLocation: 'Adult Lending',
    callNumber: 'English CAR',
    statusDesc: 'Onloan - Due: 12 Mar 2020' },
  ... ]
```

The book id `bid` can be found from the URL of the catalogue's book page:

![book id from URL](./bid.png)

## Dependencies

`axios` is used for HTTP requests, and `cheerio` for parsing HTML DOM.
