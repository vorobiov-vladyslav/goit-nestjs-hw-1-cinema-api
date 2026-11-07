#!/usr/bin/env python3
"""End-to-end smoke test for the Cinema API (checks every route and error code from the spec)."""
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get('BASE_URL', 'http://localhost:3000')
passed = []
failed = []

def call(method, path, body=None):
    url = BASE + path
    data = None
    headers = {'Accept': 'application/json'}
    if body is not None:
        data = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            raw = response.read()
            status = response.status
    except urllib.error.HTTPError as error:
        raw = error.read()
        status = error.code
    except Exception as error:
        return -1, {'error': str(error)}
    try:
        parsed = json.loads(raw) if raw else None
    except json.JSONDecodeError:
        parsed = raw.decode(errors='replace')
    return status, parsed

def check(label, condition, detail=''):
    if condition:
        passed.append(label)
        print(f'  PASS  {label}')
    else:
        failed.append(f'{label} :: {detail}')
        print(f'  FAIL  {label}  {detail}')

def expect_status(label, method, path, body, expected):
    status, data = call(method, path, body)
    check(label, status == expected, f'expected {expected}, got {status}: {str(data)[:300]}')
    return status, data

def future_iso(days=30, hour=18):
    moment = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)
    return moment.replace(hour=hour, minute=30, second=0, microsecond=0).isoformat().replace('+00:00', 'Z')

print('== Films ==')
status, film = expect_status('POST /films -> 201', 'POST', '/films',
                             {'title': 'Inception', 'durationMinutes': 148, 'releaseYear': 2010}, 201)
check('film has UUID id and fields',
      isinstance(film, dict) and isinstance(film.get('id'), str) and len(film['id']) == 36
      and film.get('title') == 'Inception' and film.get('durationMinutes') == 148
      and film.get('releaseYear') == 2010, str(film))
film_id = film.get('id') if isinstance(film, dict) else ''

status, films = expect_status('GET /films -> 200', 'GET', '/films', None, 200)
check('GET /films returns array with created film',
      isinstance(films, list) and any(item.get('id') == film_id for item in films), str(films)[:200])

status, film_one = expect_status('GET /films/:id -> 200', 'GET', f'/films/{film_id}', None, 200)
check('GET /films/:id returns the film', film_one.get('id') == film_id, str(film_one))

status, film_updated = expect_status('PATCH /films/:id -> 200', 'PATCH', f'/films/{film_id}',
                                     {'durationMinutes': 150}, 200)
check('PATCH /films/:id updates only passed field',
      film_updated.get('durationMinutes') == 150 and film_updated.get('title') == 'Inception', str(film_updated))

status, film_extra = expect_status('POST /films with unknown field -> 201 (field stripped)', 'POST', '/films',
                                   {'title': 'Whitelist test', 'durationMinutes': 90, 'releaseYear': 2001,
                                    'hacker': 'ignored'}, 201)
check('whitelist strips unknown field', 'hacker' not in (film_extra or {}), str(film_extra))

status, _ = expect_status('POST /films missing field -> 400', 'POST', '/films',
                          {'title': 'No duration', 'releaseYear': 2020}, 400)
status, _ = expect_status('POST /films wrong type -> 400', 'POST', '/films',
                          {'title': 'Bad', 'durationMinutes': '148', 'releaseYear': 2020}, 400)
status, _ = expect_status('POST /films negative duration -> 400', 'POST', '/films',
                          {'title': 'Bad', 'durationMinutes': -5, 'releaseYear': 2020}, 400)
status, _ = expect_status('GET /films/:id unknown -> 404', 'GET', '/films/00000000-0000-4000-8000-000000000000', None, 404)
status, _ = expect_status('PATCH /films/:id unknown -> 404', 'PATCH', '/films/00000000-0000-4000-8000-000000000000',
                          {'title': 'Ghost'}, 404)
status, _ = expect_status('PATCH /films/:id wrong type -> 400', 'PATCH', f'/films/{film_id}', {'title': 42}, 400)

status, _ = expect_status('PATCH /films/:id null title -> 400', 'PATCH', f'/films/{film_id}', {'title': None}, 400)
status, _ = expect_status('PATCH /films/:id null durationMinutes -> 400', 'PATCH', f'/films/{film_id}', {'durationMinutes': None}, 400)
status, _ = expect_status('PATCH /films/:id null releaseYear -> 400', 'PATCH', f'/films/{film_id}', {'releaseYear': None}, 400)

print('== Halls ==')
status, hall = expect_status('POST /halls -> 201', 'POST', '/halls',
                             {'name': 'Червона зала', 'rows': 3, 'seatsPerRow': 5}, 201)
hall_id = hall.get('id') if isinstance(hall, dict) else ''
status, halls = expect_status('GET /halls -> 200', 'GET', '/halls', None, 200)
check('GET /halls returns array with created hall',
      isinstance(halls, list) and any(item.get('id') == hall_id for item in halls), str(halls)[:200])
status, hall_one = expect_status('GET /halls/:id -> 200', 'GET', f'/halls/{hall_id}', None, 200)
seats = hall_one.get('seats') if isinstance(hall_one, dict) else None
check('GET /halls/:id returns 15 seats (3 rows x 5)',
      isinstance(seats, list) and len(seats) == 15 and all({'row', 'seat'} <= set(seat) for seat in seats),
      str(hall_one)[:300])
check('hall seats start at row 1 seat 1 and end at row 3 seat 5',
      seats and seats[0] == {'row': 1, 'seat': 1} and seats[-1] == {'row': 3, 'seat': 5}, str(seats)[:200])
status, _ = expect_status('POST /halls duplicate name -> 409', 'POST', '/halls',
                          {'name': 'Червона зала', 'rows': 2, 'seatsPerRow': 2}, 409)
status, _ = expect_status('POST /halls rows=0 -> 400', 'POST', '/halls',
                          {'name': 'Zero', 'rows': 0, 'seatsPerRow': 5}, 400)
status, _ = expect_status('GET /halls/:id unknown -> 404', 'GET', '/halls/00000000-0000-4000-8000-000000000000', None, 404)

print('== Showings ==')
showings = []
for offset_hours, index in ((0, 1), (3, 2)):
    starts = future_iso(days=30, hour=18)
    base = datetime.datetime.fromisoformat(starts.replace('Z', '+00:00'))
    starts = (base + datetime.timedelta(hours=offset_hours)).isoformat().replace('+00:00', 'Z')
    status, showing = expect_status(f'POST /showings #{index} -> 201', 'POST', '/showings',
                                    {'filmId': film_id, 'hallId': hall_id, 'startsAt': starts, 'price': 12500}, 201)
    showings.append(showing)
showing_id = showings[0].get('id') if showings and isinstance(showings[0], dict) else ''

status, listing = expect_status('GET /showings -> 200', 'GET', '/showings', None, 200)
check('GET /showings returns array with names instead of ids',
      isinstance(listing, list) and len(listing) >= 2
      and all({'filmTitle', 'hallName'} <= set(item) for item in listing)
      and listing[0].get('filmTitle') == 'Inception' and listing[0].get('hallName') == 'Червона зала',
      str(listing)[:400])
check('GET /showings sorted by startsAt ascending',
      [item['startsAt'] for item in listing] == sorted(item['startsAt'] for item in listing),
      str([item['startsAt'] for item in listing]))

status, filtered = expect_status('GET /showings?filmId -> 200', 'GET', f'/showings?filmId={film_id}', None, 200)
check('filmId filter keeps only that film', isinstance(filtered, list) and len(filtered) >= 2, str(filtered)[:200])
date_part = listing[0]['startsAt'][:10]
status, by_date = expect_status('GET /showings?date -> 200', 'GET', f'/showings?date={date_part}', None, 200)
check('date filter returns sessions of that day', isinstance(by_date, list) and len(by_date) >= 2, str(by_date)[:200])
status, _ = expect_status('GET /showings?date invalid -> 400', 'GET', '/showings?date=01.06.2027', None, 400)
status, _ = expect_status('GET /showings?date impossible -> 400', 'GET', '/showings?date=2027-02-31', None, 400)

status, showing_one = expect_status('GET /showings/:id -> 200', 'GET', f'/showings/{showing_id}', None, 200)
check('GET /showings/:id has filmTitle/hallName',
      showing_one.get('filmTitle') == 'Inception' and showing_one.get('hallName') == 'Червона зала', str(showing_one))

status, seat_map = expect_status('GET /showings/:id/seats -> 200', 'GET', f'/showings/{showing_id}/seats', None, 200)
check('seat map length = 15 and all free',
      isinstance(seat_map, list) and len(seat_map) == 15 and all(item['isBooked'] is False for item in seat_map),
      str(seat_map)[:200])

status, _ = expect_status('POST /showings unknown film -> 400', 'POST', '/showings',
                          {'filmId': '00000000-0000-4000-8000-000000000000', 'hallId': hall_id,
                           'startsAt': future_iso(), 'price': 12500}, 400)
status, _ = expect_status('POST /showings unknown hall -> 400', 'POST', '/showings',
                          {'filmId': film_id, 'hallId': '00000000-0000-4000-8000-000000000000',
                           'startsAt': future_iso(), 'price': 12500}, 400)
status, _ = expect_status('POST /showings invalid ISO -> 400', 'POST', '/showings',
                          {'filmId': film_id, 'hallId': hall_id, 'startsAt': '01.06.2027 18:30', 'price': 12500}, 400)
status, _ = expect_status('POST /showings in past -> 400', 'POST', '/showings',
                          {'filmId': film_id, 'hallId': hall_id, 'startsAt': '2020-01-01T10:00:00.000Z', 'price': 12500}, 400)
status, _ = expect_status('POST /showings price float -> 400', 'POST', '/showings',
                          {'filmId': film_id, 'hallId': hall_id, 'startsAt': future_iso(), 'price': 12.5}, 400)
status, _ = expect_status('GET /showings/:id unknown -> 404', 'GET', '/showings/00000000-0000-4000-8000-000000000000', None, 404)

print('== Bookings ==')
status, booking = expect_status('POST /showings/:id/bookings -> 201', 'POST', f'/showings/{showing_id}/bookings',
                                {'seats': [{'row': 1, 'seat': 2}, {'row': 1, 'seat': 3}]}, 201)
check('booking has id, seats and totalPrice = price * count',
      isinstance(booking, dict) and isinstance(booking.get('id'), str)
      and booking.get('totalPrice') == 25000 and len(booking.get('seats') or []) == 2, str(booking))
booking_id = booking.get('id') if isinstance(booking, dict) else ''

status, all_bookings = expect_status('GET /bookings -> 200', 'GET', '/bookings', None, 200)
check('GET /bookings returns array with booking',
      isinstance(all_bookings, list) and any(item.get('id') == booking_id for item in all_bookings), str(all_bookings)[:200])
status, showing_bookings = expect_status('GET /showings/:id/bookings -> 200', 'GET',
                                         f'/showings/{showing_id}/bookings', None, 200)
check('GET /showings/:id/bookings returns booking',
      isinstance(showing_bookings, list) and len(showing_bookings) == 1, str(showing_bookings)[:200])
status, seat_map_after = expect_status('GET /showings/:id/seats after booking -> 200', 'GET',
                                       f'/showings/{showing_id}/seats', None, 200)
booked = {(item['row'], item['seat']) for item in seat_map_after if item['isBooked']}
check('seat map marks exactly booked seats', booked == {(1, 2), (1, 3)}, str(booked))

status, _ = expect_status('POST booking occupied seat -> 409', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': 1, 'seat': 2}, {'row': 2, 'seat': 1}]}, 409)
status, after_conflict = expect_status('GET /showings/:id/bookings after 409 -> 200', 'GET',
                                       f'/showings/{showing_id}/bookings', None, 200)
check('failed booking writes nothing (atomic 409)', len(after_conflict) == 1, str(after_conflict)[:300])
status, map_after_conflict = expect_status('GET /showings/:id/seats after 409 -> 200', 'GET',
                                           f'/showings/{showing_id}/seats', None, 200)
booked_after = {(item['row'], item['seat']) for item in map_after_conflict if item['isBooked']}
check('no partial write: seat 2/1 still free', (2, 1) not in booked_after, str(booked_after))

status, _ = expect_status('POST booking duplicate seat in request -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': 2, 'seat': 2}, {'row': 2, 'seat': 2}]}, 400)
status, _ = expect_status('POST booking out of bounds -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': 4, 'seat': 1}]}, 400)
status, _ = expect_status('POST booking empty seats -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': []}, 400)

status, _ = expect_status('POST booking nested array seat ([[]]) -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [[]]}, 400)
status, _ = expect_status('POST booking empty object seat ([{}]) -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{}]}, 400)
status, _ = expect_status('POST booking seat missing row -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'seat': 1}]}, 400)
status, _ = expect_status('POST booking seat missing seat -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': 1}]}, 400)
status, _ = expect_status('POST booking row=0 -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': 0, 'seat': 1}]}, 400)
status, _ = expect_status('POST booking non-integer row -> 400', 'POST', f'/showings/{showing_id}/bookings',
                          {'seats': [{'row': '1', 'seat': 2}]}, 400)
status, bookings_after_invalid = call('GET', f'/showings/{showing_id}/bookings')
check('invalid seat payloads created no booking (e.g. seats:[[]])',
      isinstance(bookings_after_invalid, list) and len(bookings_after_invalid) == 1,
      str(bookings_after_invalid)[:200])
status, _ = expect_status('POST booking unknown showing -> 404', 'POST',
                          '/showings/00000000-0000-4000-8000-000000000000/bookings',
                          {'seats': [{'row': 1, 'seat': 1}]}, 404)
status, _ = expect_status('GET bookings unknown showing -> 404', 'GET',
                          '/showings/00000000-0000-4000-8000-000000000000/bookings', None, 404)
status, _ = expect_status('DELETE booking unknown -> 404', 'DELETE',
                          '/bookings/00000000-0000-4000-8000-000000000000', None, 404)

status, no_content = expect_status('DELETE booking -> 204', 'DELETE', f'/bookings/{booking_id}', None, 204)
status, map_after_cancel = expect_status('GET /showings/:id/seats after cancel -> 200', 'GET',
                                         f'/showings/{showing_id}/seats', None, 200)
check('cancelled booking frees seats', all(item['isBooked'] is False for item in map_after_cancel), str(map_after_cancel)[:300])
status, empty_bookings = expect_status('GET /showings/:id/bookings after cancel -> 200', 'GET',
                                       f'/showings/{showing_id}/bookings', None, 200)
check('bookings list is empty after cancel', empty_bookings == [], str(empty_bookings))

print('== Deletes ==')
status, _ = expect_status('DELETE film referenced by showing -> 409', 'DELETE', f'/films/{film_id}', None, 409)
status, _ = expect_status('DELETE hall referenced by showing -> 409', 'DELETE', f'/halls/{hall_id}', None, 409)
status, _ = expect_status('DELETE film unknown -> 404', 'DELETE', '/films/00000000-0000-4000-8000-000000000000', None, 404)
status, _ = expect_status('DELETE hall unknown -> 404', 'DELETE', '/halls/00000000-0000-4000-8000-000000000000', None, 404)

status, temp_film = expect_status('POST temp film -> 201', 'POST', '/films',
                                  {'title': 'Temp', 'durationMinutes': 80, 'releaseYear': 2024}, 201)
status, _ = expect_status('DELETE unreferenced film -> 204', 'DELETE', f'/films/{temp_film["id"]}', None, 204)
status, films_after = expect_status('GET /films -> 200', 'GET', '/films', None, 200)
check('deleted film no longer in list',
      all(item['id'] != temp_film['id'] for item in films_after), str(films_after)[:300])

status, temp_hall = expect_status('POST temp hall -> 201', 'POST', '/halls',
                                  {'name': 'Temp hall', 'rows': 1, 'seatsPerRow': 1}, 201)
status, _ = expect_status('DELETE unreferenced hall -> 204', 'DELETE', f'/halls/{temp_hall["id"]}', None, 204)

print('== Swagger ==')
status, docs = call('GET', '/docs')
check('Swagger UI available on /docs (200 HTML)', status == 200 and 'swagger' in str(docs).lower(), f'status {status}')
status, docs_json = call('GET', '/docs-json')
openapi = docs_json if isinstance(docs_json, dict) else {}
paths = set(openapi.get('paths', {}).keys())
expected_paths = {
    '/films', '/films/{id}', '/halls', '/halls/{id}', '/showings', '/showings/{id}',
    '/showings/{id}/seats', '/showings/{id}/bookings', '/bookings', '/bookings/{id}',
}
check('OpenAPI document contains all routes', expected_paths <= paths, f'missing: {expected_paths - paths}')

print()
print(f'RESULT: {len(passed)} passed, {len(failed)} failed')
if failed:
    print('FAILURES:')
    for item in failed:
        print(' -', item)
    sys.exit(1)
