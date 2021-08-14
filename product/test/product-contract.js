/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { ProductContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('ProductContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new ProductContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"product 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"product 1002 value"}'));
    });

    describe('#productExists', () => {

        it('should return true for a product', async () => {
            await contract.productExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a product that does not exist', async () => {
            await contract.productExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createProduct', () => {

        it('should create a product', async () => {
            await contract.createProduct(ctx, '1003', 'product 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"product 1003 value"}'));
        });

        it('should throw an error for a product that already exists', async () => {
            await contract.createProduct(ctx, '1001', 'myvalue').should.be.rejectedWith(/The product 1001 already exists/);
        });

    });

    describe('#readProduct', () => {

        it('should return a product', async () => {
            await contract.readProduct(ctx, '1001').should.eventually.deep.equal({ value: 'product 1001 value' });
        });

        it('should throw an error for a product that does not exist', async () => {
            await contract.readProduct(ctx, '1003').should.be.rejectedWith(/The product 1003 does not exist/);
        });

    });

    describe('#updateProduct', () => {

        it('should update a product', async () => {
            await contract.updateProduct(ctx, '1001', 'product 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"product 1001 new value"}'));
        });

        it('should throw an error for a product that does not exist', async () => {
            await contract.updateProduct(ctx, '1003', 'product 1003 new value').should.be.rejectedWith(/The product 1003 does not exist/);
        });

    });

    describe('#deleteProduct', () => {

        it('should delete a product', async () => {
            await contract.deleteProduct(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a product that does not exist', async () => {
            await contract.deleteProduct(ctx, '1003').should.be.rejectedWith(/The product 1003 does not exist/);
        });

    });

});