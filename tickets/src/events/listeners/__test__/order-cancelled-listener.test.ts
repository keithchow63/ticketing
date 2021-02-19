import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';
import { OrderCancelledEvent, OrderStatus } from '@kbtickets/common';
import { OrderCancelledListener } from '../../listeners/order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = mongoose.Types.ObjectId().toHexString();
  // create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 99,
    userId: 'anything'
  });
  ticket.set({ orderId });
  await ticket.save();

  // create a fake data event
  const data: OrderCancelledEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    ticket: {
        id: ticket.id
    }
  };

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, ticket, data, orderId, msg };
};

it('sets the orderId of the ticket', async () => {

  const { listener, ticket, data, msg } = await setup();

  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket.orderId).toBeUndefined();
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

  expect(ticketUpdatedData.orderId).toBeUndefined();
});
