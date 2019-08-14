import Parse from 'parse/react-native'; // eslint-disable-line

import { APP_ID, APP_KEY, MASTER_KEY, SERVER_URL } from 'react-native-dotenv'; // eslint-disable-line

import MockStorage from '../__jest__/MockStorage';

const storageCache = {};
const MockAsyncStorage = new MockStorage(storageCache);

jest.setMock('AsyncStorage', MockAsyncStorage);

import { AsyncStorage } from 'react-native'; // eslint-disable-line

import ParseCache from '../src'; // eslint-disable-line

let RecordObject;

let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('reset', function() {
  beforeAll(done => {
    Parse._initialize(APP_ID, APP_KEY, MASTER_KEY);
    Parse.serverURL = SERVER_URL;
    Parse.setAsyncStorage(AsyncStorage);
    ParseCache(Parse);

    RecordObject = Parse.Object.extend('Record');

    done();
  });

  afterAll(ParseCache.close);

  beforeEach(() => {
    return generate(10);
  });

  afterEach(async done => {
    const Record = new Parse.Query(RecordObject);
    try {
      const records = await Record.find();
      if (records) {
        await Parse.Object.destroyAll(records);
        await ParseCache.clearCache(null);
      }
      done();
    } catch (e) {
      console.error(e);
      done();
    }
  });

  it('should have cache method after initialization', () => {
    const Record = new Parse.Query(RecordObject);
    expect(Record.cache).toBeInstanceOf(Function);
  });

  it('should cache a simple query that uses promises with then', async done => {
    try {
      const res = await getAll(60);
      if (res) {
        expect(res.length).toBe(10);

        await generate(10);
        const res2 = await getAll(60);
        if (res2) {
          expect(res2.length).toBe(10);
          res2.map(obj => expect(obj.fromCache).toBeTruthy());
        }
      }
      done();
    } catch (e) {
      console.error(e);
      done();
    }
  });

  it('should cache a simple query that uses promises', async () => {
    const res = await getAll(60);
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);
    const cachedRes = await getAll(60);
    expect(cachedRes.length).toBe(10);
  });

  it('should not cache the same query w/out a ttl defined', async () => {
    const res = await getAll(60);
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    const nonCachedResponse = await getAllNoCache();
    nonCachedResponse.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCachedResponse.length).toBe(20);
  });

  it('should return a Parse model from cached and non-cached results', async done => {
    try {
      const res = await getAll(60);
      res.map(obj => expect(obj.fromCache).not.toBeTruthy());
      const first = res[0];

      const res2 = await getAll(60);
      res2.map(obj => expect(obj.fromCache).toBeTruthy());
      const cachedFirst = res2[0];
      expect(first.constructor.name).toBe('ParseObjectSubclass');
      expect(cachedFirst.constructor.name).toBe('ParseObjectSubclass');

      expect(res[0].isNew).not.toBeTruthy();
      expect(res2[0].isNew).not.toBeTruthy();

      done();
    } catch (e) {
      done();
    }
  });

  it('should cache a query that returns no results', async () => {
    const empty = await getNone(60);
    expect(empty.length).toBe(0);

    await generate(10);

    const cachedEmpty = await getNone(60);
    expect(cachedEmpty.length).toBe(0);
  });

  it('should correctly cache queries using select', async () => {
    const res = await getAllSelect(60, 'str');
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    const cachedRes = await getAllSelect(60, 'str');
    cachedRes.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cachedRes.length).toBe(10);

    const nonCached = await getAllSelect(60, 'num');
    nonCached.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCached.length).toBe(20);

    const nonCached2 = await getAllSelect(60, 'num', 'str');
    nonCached2.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCached2.length).toBe(20);

    const cached2 = await getAllSelect(60, 'num', 'str');
    cached2.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cached2.length).toBe(20);
  });

  it('should correctly cache queries using distinct', async () => {
    const res = await getAllDistinct(60, 'str');
    expect(res.length).toBe(10);

    const nonCached = await getAllDistinct(60, 'seqNum');
    expect(nonCached.length).toBe(10);

    await generate(10);

    const cachedRes = await getAllDistinct(60, 'str');
    expect(cachedRes.length).toBe(10);

    const cachedRes2 = await getAllDistinct(60, 'seqNum');
    expect(cachedRes2.length).toBe(10);

    const nonCached2 = await getAllDistinct(60, 'num');
    expect(nonCached2.length).toBe(10);

    const cachedRes3 = await getAllDistinct(60, 'num');
    expect(cachedRes3.length).toBe(10);

    const nonCached3 = await getAllDistinctNonCached('seqNum');
    expect(nonCached3.length).toBe(20);
  });

  it('should correctly cache queries using skip', async () => {
    const res = await getWithSkip(1, 60);
    expect(res.length).toBe(9);

    await generate(10);

    const cachedRes = await getWithSkip(1, 60);
    cachedRes.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cachedRes.length).toBe(9);

    const nonCached = await getWithSkip(2, 60);
    nonCached.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCached.length).toBe(18);
  });

  it('should correctly cache queries using limit', async () => {
    const res = await getWithLimit(5, 60);
    expect(res.length).toBe(5);

    const Record = new Parse.Query(RecordObject);
    await Record.find().then(Parse.Object.destroyAll);

    const cached = await getWithLimit(5, 60);
    cached.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cached.length).toBe(5);

    await generate(10);

    const nonCached = await getWithLimit(4, 60);
    nonCached.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCached.length).toBe(4);
  });

  it('should correctly cache the same query with different condition orders', async () => {
    const res = await getWithUnorderedQuery(60);
    expect(res.length).toBe(10);

    await generate(10);

    const cached = await getWithUnorderedQuery(60);
    expect(cached.length).toBe(10);
  });

  it('should cache a findOne query', async () => {
    const one = await getOne(60);
    expect(typeof one).toBe('object');

    const Record = new Parse.Query(RecordObject);
    await Record.find().then(Parse.Object.destroyAll);

    const cachedOne = await getOne(60);
    expect(typeof cachedOne).toBe('object');
  });

  it('should cache a regex condition properly', async () => {
    const res = await getAllWithRegex(60);
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    const cached = await getAllWithRegex(60);
    expect(cached.length).toBe(10);
    cached.map(obj => expect(obj.fromCache).toBeTruthy());

    const nonCached = await getNoneWithRegex(60);
    nonCached.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(nonCached.length).toBe(0);
  });

  it('should cache a query rerun many times', async () => {
    const res = await getAll(60);
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    await Promise.all(
      new Array(20)
        .join('.')
        .split('')
        .map(async () => {
          const cached = await getAll(60);
          expect(cached.length).toBe(10);
          cached.map(obj => expect(obj.fromCache).toBeTruthy());
        })
    );

    const cached = await getAll(60);
    cached.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cached.length).toBe(10);
  });

  it(
    'should expire the cache',
    async done => {
      try {
        await getAll(1);
        await wait(1000 * 61);
        const res2 = await getAll(1);
        expect(res2[0].fromCache).not.toBeTruthy();
        done();
      } catch (e) {
        done();
      }
    },
    1000 * 120
  );

  // it('should cache aggregate queries that use callbacks', async done => {
  //   try {
  //     const res = await aggregate(60);
  //     expect(res[0].total).toBe(45);
  //
  //     await generate(10);
  //     const cached = await aggregate(60);
  //     expect(cached[0].total).toBe(45);
  //     done();
  //   } catch (e) {
  //     console.error(e);
  //     done();
  //   }
  // });
  //
  // it('should cache aggregate queries that use Promises', async () => {
  //   const [res] = await aggregate(60);
  //   expect(res.total).toBe(45);
  //
  //   await generate(10);
  //
  //   const [cached] = await aggregate(60);
  //   expect(cached.total).toBe(45);
  // });

  it('should clear a custom cache key', async () => {
    const res = await getAllCustomKey(60, 'custom-key');
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    const cached = await getAllCustomKey(60, 'custom-key');
    cached.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cached.length).toBe(10);

    await ParseCache.clearCache('custom-key');

    const notCached = await getAllCustomKey(60, 'custom-key');
    notCached.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(notCached.length).toBe(20);
  });

  it('should cache a count query', async () => {
    const res = await count(60);
    expect(res).toBe(10);

    await generate(10);

    const cached = await count(60);
    expect(cached).toBe(10);
  });

  it('should cache a count query with zero results', async () => {
    const Record = new Parse.Query(RecordObject);
    const found = await Record.find();
    await Parse.Object.destroyAll(found);

    console.log('+++--- BEFORE COUNT');
    const res = await count(60);
    console.log('+++--- COUNT RES', res);
    expect(res).toBe(0);

    await generate(2);
    const cached = await count(60);
    console.log('+++--- COUNT CACHED', cached);

    expect(cached).toBe(0);
  });

  it('should correctly cache a query with a sort order', async () => {
    const res = await getAllSorted('num');
    res.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(res.length).toBe(10);

    await generate(10);

    const cached = await getAllSorted('num');
    cached.map(obj => expect(obj.fromCache).toBeTruthy());
    expect(cached.length).toBe(10);

    const diffSort = await getAllSorted('num', 'desc');
    diffSort.map(obj => expect(obj.fromCache).not.toBeTruthy());
    expect(diffSort.length).toBe(20);
  });
});

function getAll(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl).find();
}

function getAllCustomKey(ttl, key) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl, key).find();
}

function getAllSelect(ttl, ...select) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl)
    .select(select)
    .find();
}

function getAllDistinct(ttl, distinct) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl).distinct(distinct);
}

function getAllDistinctNonCached(distinct) {
  const Record = new Parse.Query(RecordObject);
  return Record.distinct(distinct);
}

function getAllNoCache() {
  const Record = new Parse.Query(RecordObject);
  return Record.find();
}

function getOne(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl)
    .greaterThan('num', 2)
    .first();
}

function getWithSkip(skip, ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.skip(skip)
    .cache(ttl)
    .find();
}

function getWithLimit(limit, ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.limit(limit)
    .cache(ttl)
    .find();
}

function getNone(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl)
    .equalTo('notFound', true)
    .find();
}

function getAllWithRegex(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl)
    .matches('str', /\d/)
    .find();
}

function getNoneWithRegex(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl)
    .matches('str', /\d\d/)
    .find();
}

function getWithUnorderedQuery(ttl) {
  const Record = new Parse.Query(RecordObject);
  getWithUnorderedQuery.flag = !getWithUnorderedQuery.flag;
  if (getWithUnorderedQuery.flag) {
    return Record.cache(ttl)
      .exists('num')
      .exists('str')
      .find();
  } else {
    return Record.cache(ttl)
      .exists('str')
      .exists('num')
      .find();
  }
}

function getAllSorted(sortObj, dir = 'asc') {
  const Record = new Parse.Query(RecordObject);
  const query = dir === 'asc' ? Record.ascending(sortObj) : Record.descending(sortObj);
  return query.cache(60).find();
}

function count(ttl) {
  const Record = new Parse.Query(RecordObject);
  return Record.cache(ttl).count();
}

// function countDocuments(ttl) {
//   const Record = new Parse.Query(RecordObject);
//   return Record.find({})
//     .cache(ttl)
//     .countDocuments();
// }
//
// function estimatedDocumentCount(ttl) {
//   const Record = new Parse.Query(RecordObject);
//   return Record.find({})
//     .cache(ttl)
//     .estimatedDocumentCount();
// }
//
// function aggregate(ttl) {
//   const Record = new Parse.Query(RecordObject);
//   const pipeline = [{
//     group: { _id: null, total: { $sum: '$num' } }
//   }];
//   return Record.cache(ttl).aggregate(pipeline);
// }

let recordsCount = 0;

const generate = amount => {
  const records = [];
  let count = 0;
  while (count < amount) {
    records.push({
      num: count,
      str: count.toString(),
      seqNum: recordsCount,
      seqStr: recordsCount.toString(),
    });
    recordsCount++;
    count++;
  }

  return Parse.Object.saveAll(records.map(r => new RecordObject(r)));
};
