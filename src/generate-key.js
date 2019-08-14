import jsosort from 'jsosort';
import sha1 from 'sha1';

export default function generateKey(obj) {
  obj = jsosort(obj);
  obj = JSON.stringify(obj, (key, val) => {
    return val instanceof RegExp ? String(val) : val;
  });

  return sha1(obj);
}
