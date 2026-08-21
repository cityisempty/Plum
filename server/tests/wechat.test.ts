import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { makeOauthState, parseOauthState } from "../src/lib/wechat.js";

describe("wechat oauth state", () => {
  it("往返保留 next 路径", () => {
    const state = makeOauthState("/apps/plum");
    assert.equal(parseOauthState(state), "/apps/plum");
  });

  it("拒绝篡改", () => {
    const state = makeOauthState("/apps/plum");
    assert.throws(() => parseOauthState(state + "x"));
  });

  it("拒绝外跳", () => {
    const state = makeOauthState("//evil.example");
    assert.equal(parseOauthState(state), "/");
  });
});
