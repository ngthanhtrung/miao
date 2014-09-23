'use strict';

var miao = requireLib('miao');

describe('miao', function () {
  beforeEach(function *() {
    this.stack = yield miao();
  });

  it('should bootstrap successfully', function () {
    expect(this.stack).to.be.ok;
  });
});
