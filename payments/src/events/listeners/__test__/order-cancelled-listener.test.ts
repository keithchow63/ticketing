import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';
import { OrderCancelledEvent, OrderStatus, Subjects } from '@kbtickets/common';
import { OrderCancelledListener } from '../../listeners/order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Order } from '../../../models/order';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

   // create and save a order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    price: 99,
    userId: 'anything',
  });
  await order.save();

  // create a fake data event
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,
    ticket: {
        id: 'anything'
    }
  };

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, data, msg };
};

it('sets the order status to cancelled', async () => {

  const { listener, data, msg } = await setup();

  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(data.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
