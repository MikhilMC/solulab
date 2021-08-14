/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class ProductContract extends Contract {

  async productExists(ctx, productId) {
    const buffer = await ctx.stub.getState(productId);
    return (!!buffer && buffer.length > 0);
  }

  async createProduct(ctx, productId, name, type, quantity, price) {
    const exists = await this.productExists(ctx, productId);
    if (exists) {
      throw new Error(`The product ${productId} already exists`);
    }
    const asset = {
      name,
      type,
      quantity,
      price
    };
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(productId, buffer);
  }

  async readProduct(ctx, productId) {
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`The product ${productId} does not exist`);
    }
    const buffer = await ctx.stub.getState(productId);
    const asset = JSON.parse(buffer.toString());
    return asset;
  }

  async readAllProducts(ctx) {
    const queryString = {
      selector: {}
    };
    const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = await this.getAllResults(resultsIterator, false);

    return JSON.stringify(results);
  }

  async updateProduct(ctx, productId, newName, newType, newQuantity, newPrice) {
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`The product ${productId} does not exist`);
    }
    const asset = {
      name: newName,
      type: newType,
      quantity: newQuantity,
      price: newPrice
    };
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(productId, buffer);
  }

  async deleteProduct(ctx, productId) {
    const exists = await this.productExists(ctx, productId);
    if (!exists) {
      throw new Error(`The product ${productId} does not exist`);
    }
    await ctx.stub.deleteState(productId);
  }

  async deleteAllProducts(ctx) {
    let products = await this.readAllProducts(ctx);
    products = JSON.parse(products);

    if (Array.isArray(products) && !products.length) {
      throw new Error('Products list is empty');
    } else {
      for (let index = 0; index < products.length; index++) {
        const product = products[index];
        await this.deleteProduct(ctx, product['Key']);
      }
    }
  }

  async getAllResults(iterator, isHistory) {
    let allResults = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        if (isHistory && isHistory === true) {
          jsonRes.TxId = res.value.tx_id;
          jsonRes.Timestamp = res.value.timestamp;
          jsonRes.IsDelete = res.value.is_delete.toString();
          try {
            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Value = res.value.value.toString('utf8');
          }
        } else {
          jsonRes.Key = res.value.key;
          try {
            jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
          } catch (err) {
            console.log(err);
            jsonRes.Record = res.value.value.toString('utf8');
          }
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return allResults;
      }
    }
  }

}

module.exports = ProductContract;
