import { Message } from 'node-nats-streaming';
import mongoose from 'mongoose';
import { TicketUpdatedEvent } from '@kbtickets/common';
import { TicketUpdatedListener } from '../../listeners/ticket-updated-listener';
import { natsWrapper } from '../../../nats-wrapper';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  })
  await ticket.save();

  // create a fake data event
  const data: TicketUpdatedEvent['data'] = {
    version: ticket.version + 1,
    id: ticket.id,
    title: 'new concert',
    price: 200,
    userId: 'anything',
  }

  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, data, ticket, msg };
};

it('finds, updates, and saves a ticket', async () => {
  const { listener, data, ticket, msg } = await setup();

  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket.title).toEqual(data.title);
  expect(updatedTicket.price).toEqual(data.price);
  expect(updatedTicket.version).toEqual(data.version);

});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage function wth the data object + message object
  await listener.onMessage(data, msg);

  // write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has s skipped version number', async () => {
  const { msg, data, listener, ticket } = await setup();

  data.version = 10;

  try {
    await listener.onMessage(data, msg);
  } catch (err) {}

  expect(msg.ack).not.toHaveBeenCalled();
})
