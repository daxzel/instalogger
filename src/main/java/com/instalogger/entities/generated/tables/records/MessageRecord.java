/**
 * This class is generated by jOOQ
 */
package com.instalogger.entities.generated.tables.records;

/**
 * This class is generated by jOOQ.
 */
@javax.annotation.Generated(value    = { "http://www.jooq.org", "3.2.0" },
                            comments = "This class is generated by jOOQ")
@java.lang.SuppressWarnings({ "all", "unchecked", "rawtypes" })
public class MessageRecord extends org.jooq.impl.UpdatableRecordImpl<com.instalogger.entities.generated.tables.records.MessageRecord> implements org.jooq.Record7<java.lang.Integer, java.lang.String, java.sql.Timestamp, java.lang.Integer, java.lang.Integer, java.lang.Object, java.lang.Integer> {

	private static final long serialVersionUID = 1751709683;

	/**
	 * Setter for <code>public.message.id</code>. 
	 */
	public void setId(java.lang.Integer value) {
		setValue(0, value);
	}

	/**
	 * Getter for <code>public.message.id</code>. 
	 */
	public java.lang.Integer getId() {
		return (java.lang.Integer) getValue(0);
	}

	/**
	 * Setter for <code>public.message.text</code>. 
	 */
	public void setText(java.lang.String value) {
		setValue(1, value);
	}

	/**
	 * Getter for <code>public.message.text</code>. 
	 */
	public java.lang.String getText() {
		return (java.lang.String) getValue(1);
	}

	/**
	 * Setter for <code>public.message.create_time</code>. 
	 */
	public void setCreateTime(java.sql.Timestamp value) {
		setValue(2, value);
	}

	/**
	 * Getter for <code>public.message.create_time</code>. 
	 */
	public java.sql.Timestamp getCreateTime() {
		return (java.sql.Timestamp) getValue(2);
	}

	/**
	 * Setter for <code>public.message.log_level</code>. 
	 */
	public void setLogLevel(java.lang.Integer value) {
		setValue(3, value);
	}

	/**
	 * Getter for <code>public.message.log_level</code>. 
	 */
	public java.lang.Integer getLogLevel() {
		return (java.lang.Integer) getValue(3);
	}

	/**
	 * Setter for <code>public.message.server_id</code>. 
	 */
	public void setServerId(java.lang.Integer value) {
		setValue(4, value);
	}

	/**
	 * Getter for <code>public.message.server_id</code>. 
	 */
	public java.lang.Integer getServerId() {
		return (java.lang.Integer) getValue(4);
	}

	/**
	 * Setter for <code>public.message.text_tsvector</code>. 
	 */
	public void setTextTsvector(java.lang.Object value) {
		setValue(5, value);
	}

	/**
	 * Getter for <code>public.message.text_tsvector</code>. 
	 */
	public java.lang.Object getTextTsvector() {
		return (java.lang.Object) getValue(5);
	}

	/**
	 * Setter for <code>public.message.hash</code>. 
	 */
	public void setHash(java.lang.Integer value) {
		setValue(6, value);
	}

	/**
	 * Getter for <code>public.message.hash</code>. 
	 */
	public java.lang.Integer getHash() {
		return (java.lang.Integer) getValue(6);
	}

	// -------------------------------------------------------------------------
	// Primary key information
	// -------------------------------------------------------------------------

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Record1<java.lang.Integer> key() {
		return (org.jooq.Record1) super.key();
	}

	// -------------------------------------------------------------------------
	// Record7 type implementation
	// -------------------------------------------------------------------------

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Row7<java.lang.Integer, java.lang.String, java.sql.Timestamp, java.lang.Integer, java.lang.Integer, java.lang.Object, java.lang.Integer> fieldsRow() {
		return (org.jooq.Row7) super.fieldsRow();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Row7<java.lang.Integer, java.lang.String, java.sql.Timestamp, java.lang.Integer, java.lang.Integer, java.lang.Object, java.lang.Integer> valuesRow() {
		return (org.jooq.Row7) super.valuesRow();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.Integer> field1() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.ID;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.String> field2() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.TEXT;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.sql.Timestamp> field3() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.CREATE_TIME;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.Integer> field4() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.LOG_LEVEL;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.Integer> field5() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.SERVER_ID;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.Object> field6() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.TEXT_TSVECTOR;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public org.jooq.Field<java.lang.Integer> field7() {
		return com.instalogger.entities.generated.tables.Message.MESSAGE.HASH;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.Integer value1() {
		return getId();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.String value2() {
		return getText();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.sql.Timestamp value3() {
		return getCreateTime();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.Integer value4() {
		return getLogLevel();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.Integer value5() {
		return getServerId();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.Object value6() {
		return getTextTsvector();
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public java.lang.Integer value7() {
		return getHash();
	}

	// -------------------------------------------------------------------------
	// Constructors
	// -------------------------------------------------------------------------

	/**
	 * Create a detached MessageRecord
	 */
	public MessageRecord() {
		super(com.instalogger.entities.generated.tables.Message.MESSAGE);
	}

	/**
	 * Create a detached, initialised MessageRecord
	 */
	public MessageRecord(java.lang.Integer id, java.lang.String text, java.sql.Timestamp createTime, java.lang.Integer logLevel, java.lang.Integer serverId, java.lang.Object textTsvector, java.lang.Integer hash) {
		super(com.instalogger.entities.generated.tables.Message.MESSAGE);

		setValue(0, id);
		setValue(1, text);
		setValue(2, createTime);
		setValue(3, logLevel);
		setValue(4, serverId);
		setValue(5, textTsvector);
		setValue(6, hash);
	}
}
