/**
 * PersonalInfo - Value Object (DDD)
 * Immutable representation of a citizen's personal information
 */
export class PersonalInfo {
  constructor(name, age, neighborhood) {
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    this._name = name.trim();
    this._age = age || null;
    this._neighborhood = neighborhood || null;

    Object.freeze(this);
  }

  get name() {
    return this._name;
  }

  get age() {
    return this._age;
  }

  get neighborhood() {
    return this._neighborhood;
  }

  equals(other) {
    if (!(other instanceof PersonalInfo)) return false;
    return this._name === other._name &&
           this._age === other._age &&
           this._neighborhood === other._neighborhood;
  }

  toString() {
    return `${this._name}${this._age ? `, ${this._age} anos` : ''}${this._neighborhood ? ` - ${this._neighborhood}` : ''}`;
  }
}
