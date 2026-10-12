import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reflectionSchema, contentDraftSchema, preferencesSchema, mayTransition, approvedTokens } from '../../packages/domain/src/index';

test('private reflection rejects blank, excessive and ownership fields', () => {
  assert.equal(reflectionSchema.safeParse({body:'   '}).success,false);
  assert.equal(reflectionSchema.safeParse({body:'x'.repeat(20001)}).success,false);
  assert.equal(reflectionSchema.safeParse({body:'A private thought',user_id:'someone-else'}).success,false);
  assert.equal(reflectionSchema.parse({body:' A private thought '}).body,'A private thought');
});
test('draft input cannot impersonate founder approval or publication', () => {
  const draft={title:'A draft',slug:'a-draft',body:'Words to review',kind:'essay',audience:'public',provenance:'user_authored'};
  assert.equal(contentDraftSchema.safeParse(draft).success,true);
  assert.equal(contentDraftSchema.safeParse({...draft,founder_approved:true}).success,false);
  assert.equal(contentDraftSchema.safeParse({...draft,state:'published'}).success,false);
  assert.equal(contentDraftSchema.safeParse({...draft,slug:'../../private'}).success,false);
});
test('publication requires founder, verified rights and an approved source state', () => {
  assert.equal(mayTransition('draft','published','founder'),false);
  assert.equal(mayTransition('review','approved','editor'),false);
  assert.equal(mayTransition('review','approved','founder'),true);
  assert.equal(mayTransition('approved','published','editor'),false);
  assert.equal(mayTransition('approved','published','founder'),true);
  assert.equal(mayTransition('published','draft','editor'),false);
  assert.equal(mayTransition('draft','archived','founder'),false);
});
test('theme and approved hybrid colors are exact', () => {
  assert.equal(preferencesSchema.safeParse({theme:'unknown',ai_enabled:false}).success,false);
  assert.equal(approvedTokens.dark.bg,'#0A0D16');
  assert.equal(approvedTokens.light.accentText,'#94560A');
  assert.deepEqual(approvedTokens.scale,[12,14,16,19,23,30,40,56,76]);
});
