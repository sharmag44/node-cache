interface CacheRecord {
      value: any;
      expire?: Date | number | any;
      timeout?: NodeJS.Timeout;
}
class Cache {
      private _cache: { [key: string]: CacheRecord } = {};
      private _hitCount: number = 0;
      private _missCount: number = 0;
      private _size: number = 0;
      private _debug: boolean = false;

      public put(
            key: string,
            value: any,
            time?: number,
            timeoutCallback?: (key: string, value: any) => void,
      ): any {
            if (this._debug) {
                  console.log(`caching: ${key} = ${value} (@${time})`);
            }

            if (
                  typeof time !== 'undefined' &&
                  (typeof time !== 'number' || isNaN(time) || time <= 0)
            ) {
                  throw new Error('Cache timeout must be a positive number');
            } else if (
                  typeof timeoutCallback !== 'undefined' &&
                  typeof timeoutCallback !== 'function'
            ) {
                  throw new Error('Cache timeout callback must be a function');
            }

            const oldRecord = this._cache[key];
            if (oldRecord) {
                  clearTimeout(oldRecord.timeout);
            } else {
                  this._size++;
            }

            const record: CacheRecord = {
                  value,
                  expire: time ? time + Date.now() : undefined,
            };

            if (!isNaN(record.expire)) {
                  record.timeout = setTimeout(() => {
                        this._del(key);
                        if (timeoutCallback) {
                              timeoutCallback(key, value);
                        }
                  }, time!);
            }

            this._cache[key] = record;

            return value;
      }

      public del(key: string): boolean {
            let canDelete: boolean = true;

            const oldRecord = this._cache[key];
            if (oldRecord) {
                  clearTimeout(oldRecord.timeout);
                  if (
                        !isNaN(oldRecord.expire!) &&
                        oldRecord.expire! < Date.now()
                  ) {
                        canDelete = false;
                  }
            } else {
                  canDelete = false;
            }

            if (canDelete) {
                  this._del(key);
            }

            return canDelete;
      }

      public clear(): void {
            for (const key in this._cache) {
                  clearTimeout(this._cache[key].timeout);
            }
            this._size = 0;
            this._cache = {};
            if (this._debug) {
                  this._hitCount = 0;
                  this._missCount = 0;
            }
      }

      public get(key: string): any {
            const data = this._cache[key];
            if (typeof data !== 'undefined') {
                  if (isNaN(data.expire!) || data.expire! >= Date.now()) {
                        if (this._debug) this._hitCount++;
                        return data.value;
                  } else {
                        // free some space
                        if (this._debug) this._missCount++;
                        this._size--;
                        delete this._cache[key];
                  }
            } else if (this._debug) {
                  this._missCount++;
            }
            return null;
      }

      public size(): number {
            return this._size;
      }

      public memsize(): number {
            return Object.keys(this._cache).length;
      }

      public debug(bool: boolean): void {
            this._debug = bool;
      }

      public hits(): number {
            return this._hitCount;
      }

      public misses(): number {
            return this._missCount;
      }

      public keys(): string[] {
            return Object.keys(this._cache);
      }

      public exportJson(): string {
            const plainJsCache: { [key: string]: CacheRecord } = {};

            for (const key in this._cache) {
                  const record = this._cache[key];
                  plainJsCache[key] = {
                        value: record.value,
                        expire: record.expire || 'NaN',
                  };
            }

            return JSON.stringify(plainJsCache);
      }

      public importJson(
            jsonToImport: string,
            options?: { skipDuplicates?: boolean },
      ): number {
            const cacheToImport = JSON.parse(jsonToImport);
            const currTime = Date.now();

            const skipDuplicates = options && options.skipDuplicates;

            for (const key in cacheToImport) {
                  if (cacheToImport.hasOwnProperty(key)) {
                        if (skipDuplicates) {
                              const existingRecord = this._cache[key];
                              if (existingRecord) {
                                    if (this._debug) {
                                          console.log(
                                                `Skipping duplicate imported key '${key}'`,
                                          );
                                    }
                                    continue;
                              }
                        }

                        const record = cacheToImport[key];

                        // record.expire could be `'NaN'` if no expiry was set.
                        // Try to subtract from it; a string minus a number is `NaN`, which is perfectly fine here.
                        const remainingTime = record.expire - currTime;

                        if (remainingTime <= 0) {
                              // Delete any record that might exist with the same key, since this key is expired.
                              this.del(key);
                              continue;
                        }

                        // Remaining time must now be either positive or `NaN`,
                        // but `put` will throw an error if we try to give it `NaN`.
                        this.put(
                              key,
                              record.value,
                              remainingTime > 0 ? remainingTime : undefined,
                        );
                  }
            }

            return this.size();
      }

      private _del(key: string): void {
            this._size--;
            delete this._cache[key];
      }
}

export default Cache;
