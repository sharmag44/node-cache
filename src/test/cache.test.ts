import Cache from '../index';

let cache: any;
let clock: any;

beforeEach(() => {
      clock = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());
      cache = new Cache();
});

afterEach(() => {
      clock.mockRestore();
});

describe('node-cache', () => {
      describe('put()', () => {
            beforeAll(() => {
                  cache.debug(false);
            });

            it('should allow adding a new item to the cache', () => {
                  expect(() => {
                        cache.put('key', 'value');
                  }).not.toThrow();
            });

            it('should allow adding a new item to the cache with a timeout', () => {
                  expect(() => {
                        cache.put('key', 'value', 100);
                  }).not.toThrow();
            });

            // Other test cases...

            it('should return the cached value', () => {
                  expect(cache.put('key', 'value')).toEqual('value');
            });
      });

      // Other describe blocks...

      describe('Cache()', () => {
            it('should return a new cache instance when called', () => {
                  const cache1 = new Cache();
                  const cache2 = new Cache();
                  cache1.put('key', 'value1');
                  expect(cache1.keys()).toEqual(['key']);
                  expect(cache2.keys()).toEqual([]);
                  cache2.put('key', 'value2');
                  expect(cache1.get('key')).toEqual('value1');
                  expect(cache2.get('key')).toEqual('value2');
            });
      });
});
