<?php

# DB Abstraction
# Created by Justin Miller on 5.19.2012

class DB {
	private $dbHost = "localhost";
	private $dbUser = "";
	private $dbPass = "";
	private $dbName = "";
	private $dbPort = 3306;
	private $dbSock = "/var/lib/mysql/mysql.sock";
	
	private $mysqli = -1;
	private $sql = "";
	private $resultStmt = NULL;
	
	public $isConnected = false;
	public $error = "";
	public $queryTime = 0;
	
	
	# Constructor
	public function __construct() {
		$this->isConnected = false;
		$this->error = "";
		$this->mysqli = new mysqli($this->dbHost, $this->dbUser, $this->dbPass, $this->dbName, $this->dbPort, $this->dbSock);
		if ($this->mysqli->connect_errno) {
			$this->error = $this->mysqli->connect_error;
		}
		else {
			$this->isConnected = true;
		}
	}
	
	# Destructor
	public function __destructor() {
		$this->disconnect();
	}
	
	# Disconnect from DB
	public function disconnect() {
		if ($this->isConnected) {
			$this->mysqli->close();
		}
		$this->isConnected = false;
	}
	
	# Query
	public function query() {
		$this->error = "";
		$this->queryTime = 0;
		$start_processing = microtime(true);
		$_args = func_get_args();
		
		if (count($_args) > 0) {
			$this->sql = array_shift($_args);
			if ($this->isConnected) {
				if ($this->resultStmt = $this->mysqli->prepare($this->sql)) {
					if ($this->mysqli->errno) {
						$this->error = $this->mysqli->error;
						return false;
					}
					
					# Bind parameters
					if (count($_args) > 0) {
						call_user_func_array(array($this->resultStmt, "bind_param"), $_args);
					}
					
					# Execute
					$this->resultStmt->execute();
					
					# Store Result
					$this->resultStmt->store_result();
					$this->queryTime = microtime(true) - $start_processing;
					
					return true;
				}
				elseif ($this->mysqli->errno) {
					$this->error = "Mysqli Errno: " . $this->mysqli->errno;
				}
				else {
					$this->error = "Could not prepare statement: " . $this->sql;
				}
			}
			else {
				$this->error = "DB is not connected";
			}
		}
		else {
			$this->error = "No arguments exist";
		}
		return false;
	}
	
	# Fetch Results
	public function fetchAll() {
		$params = array();
		$result = array();
		if ($this->resultStmt) {
			
			# Bind array to the result set
			$meta = $this->resultStmt->result_metadata();
			while ($field = $meta->fetch_field()) {
				$params[] = &$row[$field->name];
			}
			call_user_func_array(array($this->resultStmt, "bind_result"), $params);
			
			# Fetch all rows, indexed associatively
			while ($this->resultStmt->fetch()) {
				$result2 = array();
				foreach ($row as $key => $val) {
					$result2[$key] = $val;
				}
				$result[] = $result2;
			}
			
			$meta->free();
			return $result;
		}
		return $result;
	}
	
	# Result stats
	public function numRows() {
		return ($this->resultStmt) ? $this->resultStmt->num_rows : 0;
	}
	public function affectedRows() {
		return ($this->resultStmt) ? $this->resultStmt->affected_rows : 0;
	}
	public function insertID() {
		return ($this->resultStmt) ? $this->resultStmt->insert_id : 0;
	}
	
	# Error
	public function error() {
		return ($this->error) ? $this->error : false;
	}
	
	# Ping
	public function ping() {
		return $this->mysqli->ping();
	}
	
	public function queryTime() {
		$qt = round($this->queryTime * 1000, 2);
		$sl = ($qt > 2) ? "SLOW" : "OK";
		return "$qt $sl";
	}
	
	# Free Result
	public function freeResult() {
		if ($this->isConnected && $this->resultStmt) {
			$this->resultStmt->close();
			$this->resultStmt = NULL;
		}
	}
	
}
?>
