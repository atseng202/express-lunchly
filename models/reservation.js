"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(val) {
    if (!Number(val) || Number(val) < 1) {
      throw new BadRequestError('Reservations must be a number greater than 0.')
    }
    this._numGuests = val;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** Helper function
   * Check if reservation is after today
   */

   isAfterToday() {
     return this.startAt >= Date.now();
   }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1
           ORDER BY start_at DESC`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** save this reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations 
            (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, 
          this.numGuests, 
          this.startAt, 
          this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET num_guests=$1,
                 start_at=$2,
                 notes=$3
             WHERE id = $4`,
        [this.numGuests, 
          this.startAt, 
          this.notes,
           this.id]
      );
    }
  }
}

module.exports = Reservation;
