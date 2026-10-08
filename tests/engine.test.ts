import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIntake,categoryCodes} from '../src/engine.js';
test('all five categories seeded in code',()=>assert.deepEqual(categoryCodes,['cleaning','babysitting','hair','plumbing','tutorial']));
test('babysitting requires safeguarding intake',()=>assert.deepEqual(validateIntake('babysitting',{}),['childCount','childAges','guardianContact','careDuties','emergencyArrangements']));
test('valid plumbing intake passes',()=>assert.deepEqual(validateIntake('plumbing',{problemType:'leak',description:'Kitchen sink'}),[]));
