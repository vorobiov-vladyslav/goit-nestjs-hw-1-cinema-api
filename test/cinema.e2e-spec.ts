import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('Cinema API (e2e)', () => {
  let app: INestApplication;
  let http: any;
  let dateNowSpy: jest.SpyInstance<number, []> | undefined;

  let showingsUtcDay: string;
  let showingStartsAt: (hour: number) => string;

  const FIXED_NOW = process.env.FIXED_NOW;
  const uuidUnknown = '00000000-0000-4000-8000-000000000000';

  const futureIso = (hoursFromNow: number): string =>
    new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();

  let filmId: string;
  let hallId: string;
  let showingId: string;
  let showingLaterId: string;
  let bookingId: string;

  beforeAll(async () => {
    if (FIXED_NOW) {
      const fixedTimestamp = Date.parse(FIXED_NOW);
      if (Number.isNaN(fixedTimestamp)) {
        throw new Error(`FIXED_NOW is not a valid ISO date: ${FIXED_NOW}`);
      }
      dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);
    }

    const targetDay = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    showingsUtcDay = targetDay.toISOString().slice(0, 10);
    showingStartsAt = (hour: number): string =>
      `${showingsUtcDay}T${String(hour).padStart(2, '0')}:00:00.000Z`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    dateNowSpy?.mockRestore();
  });

  describe('films', () => {
    it('POST /films creates a film with UUID and returns 201', async () => {
      const response = await request(http)
        .post('/films')
        .send({ title: 'Inception', durationMinutes: 148, releaseYear: 2010 })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Inception',
        durationMinutes: 148,
        releaseYear: 2010,
      });
      expect(response.body.id).toMatch(/^[0-9a-f-]{36}$/);
      filmId = response.body.id;
    });

    it('POST /films rejects missing field, wrong type and non-positive duration (400)', async () => {
      await request(http)
        .post('/films')
        .send({ title: 'No duration', releaseYear: 2020 })
        .expect(400);

      await request(http)
        .post('/films')
        .send({ title: 'Wrong type', durationMinutes: '148', releaseYear: 2020 })
        .expect(400);

      await request(http)
        .post('/films')
        .send({ title: 'Negative', durationMinutes: -5, releaseYear: 2020 })
        .expect(400);
    });

    it('POST /films strips fields that are not in the DTO (whitelist)', async () => {
      const response = await request(http)
        .post('/films')
        .send({ title: 'Whitelist', durationMinutes: 90, releaseYear: 2001, hacker: 'x' })
        .expect(201);

      expect(response.body.hacker).toBeUndefined();
    });

    it('GET /films returns an array with the created film', async () => {
      const response = await request(http).get('/films').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((film: { id: string }) => film.id === filmId)).toBe(true);
    });

    it('GET /films/:id returns the film, unknown id -> 404', async () => {
      const response = await request(http).get(`/films/${filmId}`).expect(200);
      expect(response.body.id).toBe(filmId);

      await request(http).get(`/films/${uuidUnknown}`).expect(404);
    });

    it('PATCH /films/:id updates only provided fields, validates types and 404', async () => {
      const response = await request(http)
        .patch(`/films/${filmId}`)
        .send({ durationMinutes: 150 })
        .expect(200);

      expect(response.body.durationMinutes).toBe(150);
      expect(response.body.title).toBe('Inception');

      await request(http).patch(`/films/${filmId}`).send({ title: 42 }).expect(400);
      await request(http).patch(`/films/${uuidUnknown}`).send({ title: 'Ghost' }).expect(404);
    });

    it('PATCH /films/:id rejects explicit nulls but still allows omitted fields (400)', async () => {
      await request(http).patch(`/films/${filmId}`).send({ title: null }).expect(400);
      await request(http).patch(`/films/${filmId}`).send({ durationMinutes: null }).expect(400);
      await request(http).patch(`/films/${filmId}`).send({ releaseYear: null }).expect(400);

      const response = await request(http).patch(`/films/${filmId}`).send({}).expect(200);
      expect(response.body).toMatchObject({
        id: filmId,
        title: 'Inception',
        durationMinutes: 150,
        releaseYear: 2010,
      });
    });
  });

  describe('halls', () => {
    it('POST /halls creates a 3x5 hall', async () => {
      const response = await request(http)
        .post('/halls')
        .send({ name: 'Червона зала', rows: 3, seatsPerRow: 5 })
        .expect(201);

      expect(response.body).toMatchObject({ name: 'Червона зала', rows: 3, seatsPerRow: 5 });
      hallId = response.body.id;
    });

    it('POST /halls rejects duplicate name (409) and invalid numbers (400)', async () => {
      await request(http)
        .post('/halls')
        .send({ name: 'Червона зала', rows: 2, seatsPerRow: 2 })
        .expect(409);

      await request(http).post('/halls').send({ name: 'Zero', rows: 0, seatsPerRow: 5 }).expect(400);
    });

    it('GET /halls returns the created hall, GET /halls/:id returns 15 seats', async () => {
      const list = await request(http).get('/halls').expect(200);
      expect(list.body.some((hall: { id: string }) => hall.id === hallId)).toBe(true);

      const response = await request(http).get(`/halls/${hallId}`).expect(200);
      expect(response.body.seats).toHaveLength(15);
      expect(response.body.seats[0]).toEqual({ row: 1, seat: 1 });
      expect(response.body.seats[14]).toEqual({ row: 3, seat: 5 });
    });

    it('GET /halls/:id unknown -> 404', async () => {
      await request(http).get(`/halls/${uuidUnknown}`).expect(404);
    });
  });

  describe('showings', () => {
    it('POST /showings validates film, hall, date format, past dates and price (400)', async () => {
      await request(http)
        .post('/showings')
        .send({ filmId: uuidUnknown, hallId, startsAt: futureIso(48), price: 12500 })
        .expect(400);

      await request(http)
        .post('/showings')
        .send({ filmId, hallId: uuidUnknown, startsAt: futureIso(48), price: 12500 })
        .expect(400);

      await request(http)
        .post('/showings')
        .send({ filmId, hallId, startsAt: '01.06.2027 18:30', price: 12500 })
        .expect(400);

      await request(http)
        .post('/showings')
        .send({ filmId, hallId, startsAt: '2020-01-01T10:00:00.000Z', price: 12500 })
        .expect(400);

      await request(http)
        .post('/showings')
        .send({ filmId, hallId, startsAt: futureIso(48), price: 12.5 })
        .expect(400);
    });

    it('POST /showings creates two showings on the same fixed UTC date (201)', async () => {
      const first = await request(http)
        .post('/showings')
        .send({ filmId, hallId, startsAt: showingStartsAt(10), price: 12500 })
        .expect(201);

      const later = await request(http)
        .post('/showings')
        .send({ filmId, hallId, startsAt: showingStartsAt(14), price: 15000 })
        .expect(201);

      expect(first.body.id).toBeDefined();
      expect(later.body.id).toBeDefined();
      showingId = first.body.id;
      showingLaterId = later.body.id;

      expect(showingStartsAt(10).slice(0, 10)).toBe(showingStartsAt(14).slice(0, 10));
      expect(showingStartsAt(10).slice(0, 10)).toBe(showingsUtcDay);
    });

    it('GET /showings returns names instead of ids and is sorted by startsAt', async () => {
      const response = await request(http).get('/showings').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toMatchObject({
        filmTitle: 'Inception',
        hallName: 'Червона зала',
      });

      const timestamps = response.body.map((item: { startsAt: string }) => item.startsAt);
      expect(timestamps).toEqual([...timestamps].sort());
    });

    it('GET /showings filters by filmId and by date, invalid date -> 400', async () => {
      const byFilm = await request(http).get(`/showings?filmId=${filmId}`).expect(200);
      expect(byFilm.body.length).toBeGreaterThanOrEqual(2);

      const byDate = await request(http).get(`/showings?date=${showingsUtcDay}`).expect(200);
      expect(byDate.body.length).toBeGreaterThanOrEqual(2);
      expect(
        byDate.body.every((item: { startsAt: string }) => item.startsAt.startsWith(showingsUtcDay)),
      ).toBe(true);

      await request(http).get('/showings?date=01.06.2027').expect(400);
      await request(http).get('/showings?date=2027-02-31').expect(400);
    });

    it('GET /showings/:id returns one showing with names, unknown -> 404', async () => {
      const response = await request(http).get(`/showings/${showingId}`).expect(200);
      expect(response.body).toMatchObject({
        id: showingId,
        filmTitle: 'Inception',
        hallName: 'Червона зала',
        price: 12500,
      });

      await request(http).get(`/showings/${uuidUnknown}`).expect(404);
    });

    it('GET /showings/:id/seats returns the hall seat map (all free)', async () => {
      const response = await request(http).get(`/showings/${showingId}/seats`).expect(200);
      expect(response.body).toHaveLength(15);
      expect(response.body.every((seat: { isBooked: boolean }) => seat.isBooked === false)).toBe(true);

      await request(http).get(`/showings/${uuidUnknown}/seats`).expect(404);
    });
  });

  describe('bookings', () => {
    it('POST /showings/:id/bookings books seats and computes totalPrice', async () => {
      const response = await request(http)
        .post(`/showings/${showingId}/bookings`)
        .send({ seats: [{ row: 1, seat: 2 }, { row: 1, seat: 3 }] })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.totalPrice).toBe(25000);
      expect(response.body.seats).toEqual([
        { row: 1, seat: 2 },
        { row: 1, seat: 3 },
      ]);
      bookingId = response.body.id;
    });

    it('GET /bookings and GET /showings/:id/bookings return the booking', async () => {
      const all = await request(http).get('/bookings').expect(200);
      expect(all.body.some((item: { id: string }) => item.id === bookingId)).toBe(true);

      const byShowing = await request(http).get(`/showings/${showingId}/bookings`).expect(200);
      expect(byShowing.body).toHaveLength(1);
      expect(byShowing.body[0].id).toBe(bookingId);
    });

    it('seat map marks exactly the booked seats', async () => {
      const response = await request(http).get(`/showings/${showingId}/seats`).expect(200);
      const booked = response.body
        .filter((seat: { isBooked: boolean }) => seat.isBooked)
        .map((seat: { row: number; seat: number }) => `${seat.row}:${seat.seat}`)
        .sort();

      expect(booked).toEqual(['1:2', '1:3']);
    });

    it('occupied seat -> 409 and no partial write', async () => {
      await request(http)
        .post(`/showings/${showingId}/bookings`)
        .send({ seats: [{ row: 1, seat: 2 }, { row: 2, seat: 1 }] })
        .expect(409);

      const bookings = await request(http).get(`/showings/${showingId}/bookings`).expect(200);
      expect(bookings.body).toHaveLength(1);

      const seats = await request(http).get(`/showings/${showingId}/seats`).expect(200);
      const seat = seats.body.find((item: { row: number; seat: number }) => item.row === 2 && item.seat === 1);
      expect(seat.isBooked).toBe(false);
    });

    it('invalid booking payloads -> 400, unknown showing -> 404', async () => {
      await request(http)
        .post(`/showings/${showingId}/bookings`)
        .send({ seats: [{ row: 2, seat: 2 }, { row: 2, seat: 2 }] })
        .expect(400);

      await request(http)
        .post(`/showings/${showingId}/bookings`)
        .send({ seats: [{ row: 4, seat: 1 }] })
        .expect(400);

      await request(http).post(`/showings/${showingId}/bookings`).send({ seats: [] }).expect(400);

      await request(http)
        .post(`/showings/${uuidUnknown}/bookings`)
        .send({ seats: [{ row: 1, seat: 1 }] })
        .expect(404);

      await request(http).get(`/showings/${uuidUnknown}/bookings`).expect(404);
    });

    it('rejects invalid seat entries: nested arrays, empty objects, missing row/seat, bad numbers', async () => {
      const before = await request(http).get('/bookings').expect(200);

      const invalidSeatPayloads: unknown[][] = [
        [[]],
        [{}],
        [{ seat: 1 }],
        [{ row: 1 }],
        [{ row: 0, seat: 1 }],
        [{ row: 1, seat: -1 }],
        [{ row: '1', seat: 2 }],
        [{ row: 1.5, seat: 2 }],
        [null],
      ];

      for (const seats of invalidSeatPayloads) {
        await request(http).post(`/showings/${showingId}/bookings`).send({ seats }).expect(400);
      }

      const after = await request(http).get('/bookings').expect(200);
      expect(after.body).toHaveLength(before.body.length);
      expect(after.body).toHaveLength(1);
    });

    it('DELETE /bookings/:id cancels the booking and frees seats (204)', async () => {
      await request(http).delete(`/bookings/${bookingId}`).expect(204);
      await request(http).delete(`/bookings/${uuidUnknown}`).expect(404);

      const seats = await request(http).get(`/showings/${showingId}/seats`).expect(200);
      expect(seats.body.every((seat: { isBooked: boolean }) => seat.isBooked === false)).toBe(true);

      const bookings = await request(http).get(`/showings/${showingId}/bookings`).expect(200);
      expect(bookings.body).toEqual([]);
    });
  });

  describe('deleting films and halls', () => {
    it('referenced film/hall cannot be deleted (409)', async () => {
      await request(http).delete(`/films/${filmId}`).expect(409);
      await request(http).delete(`/halls/${hallId}`).expect(409);
    });

    it('unknown film/hall -> 404', async () => {
      await request(http).delete(`/films/${uuidUnknown}`).expect(404);
      await request(http).delete(`/halls/${uuidUnknown}`).expect(404);
    });

    it('unreferenced film and hall can be deleted (204)', async () => {
      const film = await request(http)
        .post('/films')
        .send({ title: 'Temp', durationMinutes: 80, releaseYear: 2024 })
        .expect(201);
      await request(http).delete(`/films/${film.body.id}`).expect(204);

      const hall = await request(http)
        .post('/halls')
        .send({ name: 'Temp hall', rows: 1, seatsPerRow: 1 })
        .expect(201);
      await request(http).delete(`/halls/${hall.body.id}`).expect(204);
    });

    it('second showing of the same film still keeps the film referenced', async () => {
      const response = await request(http).get('/showings').expect(200);
      const ids = response.body.map((item: { id: string }) => item.id);
      expect(ids).toEqual(expect.arrayContaining([showingId, showingLaterId]));
    });
  });
});
