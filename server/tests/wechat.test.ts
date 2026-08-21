import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWechatRedirectUri, makeOauthState, parseOauthState } from "../src/lib/wechat.js";

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

describe("wechat redirect uri", () => {
  it("默认使用当前站点回调", () => {
    assert.equal(buildWechatRedirectUri("https://plum.example.com/"), "https://plum.example.com/api/auth/wechat/callback");
  });

  it("优先使用统一服务号认证回调", () => {
    assert.equal(
      buildWechatRedirectUri("https://plum.example.com", "http://bid.xinlioa.com/index.php?app_name=plum"),
      "http://bid.xinlioa.com/index.php?app_name=plum",
    );
  });
});
