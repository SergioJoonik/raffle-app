
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createRaffleInputSchema,
  updateRaffleInputSchema,
  participateInRaffleInputSchema,
  getRaffleByLinkInputSchema,
  selectWinnerInputSchema,
  getRafflesByCreatorInputSchema,
  getRaffleParticipantsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createRaffle } from './handlers/create_raffle';
import { getRaffles } from './handlers/get_raffles';
import { getRaffleById } from './handlers/get_raffle_by_id';
import { getRaffleByLink } from './handlers/get_raffle_by_link';
import { updateRaffle } from './handlers/update_raffle';
import { getRafflesByCreator } from './handlers/get_raffles_by_creator';
import { participateInRaffle } from './handlers/participate_in_raffle';
import { getRaffleParticipants } from './handlers/get_raffle_participants';
import { selectWinner } from './handlers/select_winner';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Raffle routes
  createRaffle: publicProcedure
    .input(createRaffleInputSchema)
    .mutation(({ input }) => createRaffle(input)),

  getRaffles: publicProcedure
    .query(() => getRaffles()),

  getRaffleById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getRaffleById(input.id)),

  getRaffleByLink: publicProcedure
    .input(getRaffleByLinkInputSchema)
    .query(({ input }) => getRaffleByLink(input)),

  updateRaffle: publicProcedure
    .input(updateRaffleInputSchema)
    .mutation(({ input }) => updateRaffle(input)),

  getRafflesByCreator: publicProcedure
    .input(getRafflesByCreatorInputSchema)
    .query(({ input }) => getRafflesByCreator(input)),

  // Participation routes
  participateInRaffle: publicProcedure
    .input(participateInRaffleInputSchema)
    .mutation(({ input }) => participateInRaffle(input)),

  getRaffleParticipants: publicProcedure
    .input(getRaffleParticipantsInputSchema)
    .query(({ input }) => getRaffleParticipants(input)),

  // Winner selection
  selectWinner: publicProcedure
    .input(selectWinnerInputSchema)
    .mutation(({ input }) => selectWinner(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
